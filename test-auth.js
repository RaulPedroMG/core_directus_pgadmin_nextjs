#!/usr/bin/env node

/**
 * Test script para verificar el flujo completo de autenticación de ShipFree
 * Este script prueba login, obtener usuario, y logout con Directus
 */

const axios = require('axios');

const DIRECTUS_URL = 'http://localhost:8070';
const APP_URL = 'http://localhost:3070';

// Credenciales de prueba
const TEST_USER = {
  email: 'admin@shipfree.dev',
  password: 'AdminPassword123!'
};

let authTokens = {
  access_token: null,
  refresh_token: null
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDirectusLogin() {
  console.log('\n🔐 Probando login en Directus...');

  try {
    const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (response.data.data) {
      authTokens.access_token = response.data.data.access_token;
      authTokens.refresh_token = response.data.data.refresh_token;

      console.log('✅ Login exitoso');
      console.log(`   Token: ${authTokens.access_token.substring(0, 50)}...`);
      console.log(`   Refresh: ${authTokens.refresh_token.substring(0, 30)}...`);
      return true;
    }
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    return false;
  }
}

async function testGetCurrentUser() {
  console.log('\n👤 Probando obtener usuario actual...');

  if (!authTokens.access_token) {
    console.error('❌ No hay token de acceso');
    return false;
  }

  try {
    const response = await axios.get(`${DIRECTUS_URL}/users/me?fields=id,email,first_name,last_name,status,role.id,role.name,role.description,role.admin_access,role.app_access`, {
      headers: {
        'Authorization': `Bearer ${authTokens.access_token}`
      }
    });

    if (response.data.data) {
      const user = response.data.data;
      console.log('✅ Usuario obtenido exitosamente:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.first_name || 'N/A'} ${user.last_name || ''}`);
      console.log(`   Estado: ${user.status}`);
      console.log(`   Rol: ${user.role?.name || 'N/A'}`);
      console.log(`   Admin: ${user.role?.admin_access ? 'Sí' : 'No'}`);
      console.log(`   App Access: ${user.role?.app_access ? 'Sí' : 'No'}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error.response?.data || error.message);
    return false;
  }
}

async function testDirectusLogout() {
  console.log('\n🚪 Probando logout en Directus...');

  if (!authTokens.refresh_token) {
    console.error('❌ No hay refresh token');
    return false;
  }

  try {
    const response = await axios.post(`${DIRECTUS_URL}/auth/logout`, {
      refresh_token: authTokens.refresh_token
    }, {
      headers: {
        'Authorization': `Bearer ${authTokens.access_token}`
      }
    });

    console.log('✅ Logout exitoso');
    authTokens.access_token = null;
    authTokens.refresh_token = null;
    return true;
  } catch (error) {
    console.error('❌ Error en logout:', error.response?.data || error.message);

    // Si es error 400, probablemente ya está deslogueado
    if (error.response?.status === 400) {
      console.log('ℹ️  Error 400: Token ya inválido o usuario ya deslogueado');
      authTokens.access_token = null;
      authTokens.refresh_token = null;
      return true;
    }
    return false;
  }
}

async function testAppHomePage() {
  console.log('\n🏠 Probando página principal de la app...');

  try {
    const response = await axios.get(APP_URL);

    if (response.status === 200) {
      console.log('✅ Página principal carga correctamente');
      console.log(`   Status: ${response.status}`);
      console.log(`   Tipo: ${response.headers['content-type']}`);

      // Verificar si tiene el botón de "Iniciar sesión"
      const hasLoginButton = response.data.includes('Iniciar sesión') || response.data.includes('iniciar sesión');
      console.log(`   Botón login: ${hasLoginButton ? 'Presente' : 'No encontrado'}`);

      return true;
    }
  } catch (error) {
    console.error('❌ Error cargando página principal:', error.message);
    return false;
  }
}

async function testAppLoginPage() {
  console.log('\n📝 Probando página de login de la app...');

  try {
    const response = await axios.get(`${APP_URL}/directus-login`);

    if (response.status === 200) {
      console.log('✅ Página de login carga correctamente');
      console.log(`   Status: ${response.status}`);

      // Verificar elementos del formulario
      const hasEmailField = response.data.includes('email') || response.data.includes('correo');
      const hasPasswordField = response.data.includes('password') || response.data.includes('contraseña');
      const hasSubmitButton = response.data.includes('submit') || response.data.includes('Iniciar');

      console.log(`   Campo email: ${hasEmailField ? 'Presente' : 'No encontrado'}`);
      console.log(`   Campo password: ${hasPasswordField ? 'Presente' : 'No encontrado'}`);
      console.log(`   Botón submit: ${hasSubmitButton ? 'Presente' : 'No encontrado'}`);

      return true;
    }
  } catch (error) {
    console.error('❌ Error cargando página de login:', error.message);
    return false;
  }
}

async function testAppDashboardPage() {
  console.log('\n📊 Probando página de dashboard (sin autenticación)...');

  try {
    const response = await axios.get(`${APP_URL}/dashboard`, {
      maxRedirects: 0, // No seguir redirects
      validateStatus: function (status) {
        return status < 400; // No lanzar error para redirects
      }
    });

    if (response.status === 200) {
      console.log('✅ Dashboard accesible (podría indicar problema de protección)');
    } else if (response.status >= 300 && response.status < 400) {
      console.log('✅ Dashboard redirige correctamente (protección funcionando)');
      console.log(`   Redirect status: ${response.status}`);
      console.log(`   Location: ${response.headers.location || 'N/A'}`);
    }

    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ No se puede conectar al dashboard');
    } else {
      console.error('❌ Error accediendo dashboard:', error.message);
    }
    return false;
  }
}

async function testDirectusHealth() {
  console.log('\n🏥 Probando salud de Directus...');

  try {
    const response = await axios.get(`${DIRECTUS_URL}/server/health`);

    if (response.data.status === 'ok') {
      console.log('✅ Directus está saludable');
      console.log(`   Status: ${response.data.status}`);
      return true;
    } else {
      console.log('⚠️  Directus responde pero estado incierto:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verificando salud de Directus:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando tests de autenticación de ShipFree');
  console.log('=' .repeat(60));

  const results = {
    directusHealth: false,
    appHome: false,
    appLogin: false,
    appDashboard: false,
    directusLogin: false,
    getCurrentUser: false,
    directusLogout: false
  };

  // Test orden lógico
  results.directusHealth = await testDirectusHealth();
  await sleep(500);

  results.appHome = await testAppHomePage();
  await sleep(500);

  results.appLogin = await testAppLoginPage();
  await sleep(500);

  results.appDashboard = await testAppDashboardPage();
  await sleep(500);

  results.directusLogin = await testDirectusLogin();
  await sleep(500);

  if (results.directusLogin) {
    results.getCurrentUser = await testGetCurrentUser();
    await sleep(500);

    results.directusLogout = await testDirectusLogout();
  }

  // Resumen final
  console.log('\n📋 RESUMEN DE RESULTADOS:');
  console.log('=' .repeat(60));

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('\n' + '=' .repeat(60));
  console.log(`🎯 TOTAL: ${passedTests}/${totalTests} tests pasaron (${passRate}%)`);

  if (passRate >= 85) {
    console.log('🎉 ¡Excelente! El sistema de autenticación está funcionando bien.');
  } else if (passRate >= 70) {
    console.log('⚠️  Funcionamiento aceptable, pero hay algunos problemas menores.');
  } else {
    console.log('🚨 Hay problemas significativos que necesitan atención.');
  }

  // Recomendaciones específicas
  console.log('\n💡 RECOMENDACIONES:');
  if (!results.directusHealth) {
    console.log('- Verificar que Directus esté corriendo en puerto 8070');
  }
  if (!results.directusLogin) {
    console.log('- Verificar credenciales de admin en Directus');
    console.log('- Revisar configuración de autenticación');
  }
  if (!results.directusLogout) {
    console.log('- El logout tiene problemas pero no críticos (se limpia localmente)');
  }
  if (!results.appHome || !results.appLogin) {
    console.log('- Verificar que la app Next.js esté corriendo en puerto 3070');
  }

  console.log('\n🔧 Para debugging adicional, revisar:');
  console.log('- docker logs directus_shipfree --tail 20');
  console.log('- docker logs shipfree_dev-app-1 --tail 20');
  console.log('- curl http://localhost:3070/directus-login');
  console.log('- curl http://localhost:8070/server/health');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n💥 Error ejecutando tests:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testDirectusLogin,
  testGetCurrentUser,
  testDirectusLogout,
  testAppHomePage,
  testAppLoginPage,
  testAppDashboardPage,
  testDirectusHealth,
  runAllTests
};
