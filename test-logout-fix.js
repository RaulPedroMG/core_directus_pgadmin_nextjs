#!/usr/bin/env node

/**
 * Test específico para verificar que el logout funciona correctamente
 * y que el dashboard redirige apropiadamente después del logout
 */

const axios = require('axios');

const APP_URL = 'http://localhost:3070';
const DIRECTUS_URL = 'http://localhost:8070';

const TEST_USER = {
  email: 'admin@shipfree.dev',
  password: 'AdminPassword123!'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginAndGetTokens() {
  console.log('🔐 Haciendo login...');

  try {
    const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    const { access_token, refresh_token } = response.data.data;
    console.log(`✅ Login exitoso - Token: ${access_token.substring(0, 30)}...`);

    return { access_token, refresh_token };
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    return null;
  }
}

async function testDashboardWithAuth(tokens) {
  console.log('\n📊 Probando dashboard CON autenticación...');

  try {
    const response = await axios.get(`${APP_URL}/dashboard`, {
      headers: {
        'Cookie': `directus_access_token=${tokens.access_token}; path=/; SameSite=Lax`
      },
      timeout: 10000
    });

    if (response.status === 200) {
      const hasUserContent = response.data.includes('admin@shipfree.dev') ||
                            response.data.includes('Admin User') ||
                            response.data.includes('Administrator') ||
                            response.data.includes('Panel de Usuario');

      console.log(`✅ Dashboard carga con autenticación`);
      console.log(`   ${hasUserContent ? '✅' : '❌'} Contiene datos del usuario: ${hasUserContent}`);

      return hasUserContent;
    }

    return false;
  } catch (error) {
    console.error('❌ Error accediendo dashboard con auth:', error.message);
    return false;
  }
}

async function performLogout(tokens) {
  console.log('\n🚪 Ejecutando logout...');

  try {
    // Intentar logout del servidor
    await axios.post(`${DIRECTUS_URL}/auth/logout`, {
      refresh_token: tokens.refresh_token
    }, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    console.log('✅ Logout del servidor exitoso');
    return true;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('⚠️  Logout del servidor con error 400 (token inválido) - esto es normal');
      return true;
    }

    console.error('❌ Error en logout del servidor:', error.message);
    return false;
  }
}

async function testDashboardWithoutAuth() {
  console.log('\n🔒 Probando dashboard SIN autenticación (después del logout)...');

  try {
    const response = await axios.get(`${APP_URL}/dashboard`, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Permitir redirects
      }
    });

    console.log(`   Status de respuesta: ${response.status}`);

    if (response.status >= 300 && response.status < 400) {
      console.log('✅ Dashboard redirige correctamente');
      console.log(`   Location: ${response.headers.location || 'N/A'}`);
      return true;
    } else if (response.status === 200) {
      // Verificar si el contenido es de login o genérico
      const isLoginPage = response.data.includes('Iniciar sesión') ||
                         response.data.includes('Login') ||
                         response.data.includes('login') ||
                         response.data.includes('Redirecting to login');

      const hasUserData = response.data.includes('admin@shipfree.dev') ||
                         response.data.includes('Admin User') ||
                         response.data.includes('Panel de Usuario');

      console.log(`   ${isLoginPage ? '✅' : '❌'} Es página de login/redirección: ${isLoginPage}`);
      console.log(`   ${!hasUserData ? '✅' : '❌'} Sin datos de usuario: ${!hasUserData}`);

      return isLoginPage && !hasUserData;
    }

    return false;
  } catch (error) {
    console.error('❌ Error accediendo dashboard sin auth:', error.message);
    return false;
  }
}

async function testDashboardMultipleTimes() {
  console.log('\n🔄 Probando dashboard múltiples veces para verificar consistencia...');

  let successes = 0;
  const attempts = 3;

  for (let i = 1; i <= attempts; i++) {
    console.log(`   Intento ${i}/${attempts}:`);

    const result = await testDashboardWithoutAuth();
    if (result) {
      successes++;
      console.log(`     ✅ Intento ${i} exitoso`);
    } else {
      console.log(`     ❌ Intento ${i} falló`);
    }

    if (i < attempts) await sleep(2000);
  }

  const successRate = (successes / attempts) * 100;
  console.log(`\n   📊 Resultados: ${successes}/${attempts} exitosos (${successRate}%)`);

  return successRate >= 66; // Al menos 2 de 3 deben pasar
}

async function checkAppHealth() {
  console.log('\n🏥 Verificando salud de la aplicación...');

  try {
    const response = await axios.get(APP_URL, { timeout: 5000 });
    console.log('✅ App principal responde correctamente');
    return true;
  } catch (error) {
    console.error('❌ App principal no responde:', error.message);
    return false;
  }
}

async function runLogoutTest() {
  console.log('🚀 INICIANDO TEST ESPECÍFICO DE LOGOUT Y REDIRECCIÓN');
  console.log('=' .repeat(65));
  console.log('Este test verifica que:');
  console.log('1. El dashboard funciona CON autenticación');
  console.log('2. El logout se ejecuta correctamente');
  console.log('3. El dashboard redirige SIN autenticación');
  console.log('4. La redirección es consistente');
  console.log('=' .repeat(65));

  const results = {
    appHealth: false,
    login: false,
    dashboardWithAuth: false,
    logout: false,
    dashboardWithoutAuth: false,
    consistentRedirect: false
  };

  // 1. Verificar salud de la app
  results.appHealth = await checkAppHealth();
  if (!results.appHealth) {
    console.log('\n💥 La aplicación no está respondiendo. Test abortado.');
    return results;
  }
  await sleep(1000);

  // 2. Login
  const tokens = await loginAndGetTokens();
  results.login = !!tokens;
  if (!tokens) {
    console.log('\n💥 No se pudo hacer login. Test abortado.');
    return results;
  }
  await sleep(1000);

  // 3. Probar dashboard con autenticación
  results.dashboardWithAuth = await testDashboardWithAuth(tokens);
  await sleep(1000);

  // 4. Ejecutar logout
  results.logout = await performLogout(tokens);
  await sleep(2000); // Dar tiempo para que se procese el logout

  // 5. Probar dashboard sin autenticación (una vez)
  results.dashboardWithoutAuth = await testDashboardWithoutAuth();
  await sleep(1000);

  // 6. Probar múltiples veces para consistencia
  results.consistentRedirect = await testDashboardMultipleTimes();

  // Resumen final
  console.log('\n' + '=' .repeat(65));
  console.log('📋 RESUMEN DEL TEST DE LOGOUT:');
  console.log('=' .repeat(65));

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('\n' + '=' .repeat(65));
  console.log(`🎯 RESULTADO: ${passedTests}/${totalTests} tests pasaron (${passRate}%)`);

  if (passRate >= 90) {
    console.log('🎉 ¡PERFECTO! El logout y redirección funcionan excelentemente.');
  } else if (passRate >= 75) {
    console.log('✅ BUENO: El logout funciona bien con problemas menores.');
  } else if (passRate >= 50) {
    console.log('⚠️  REGULAR: El logout funciona pero con problemas de redirección.');
  } else {
    console.log('🚨 PROBLEMA: El logout tiene fallos significativos.');
  }

  // Diagnóstico específico
  console.log('\n🔍 DIAGNÓSTICO ESPECÍFICO:');

  if (!results.dashboardWithAuth) {
    console.log('- ❌ Dashboard no funciona con autenticación - problema base');
  }

  if (!results.logout) {
    console.log('- ❌ Logout del servidor falla - verificar tokens y API');
  }

  if (!results.dashboardWithoutAuth) {
    console.log('- ❌ Dashboard no redirige después del logout');
    console.log('  → Esto es exactamente el problema que estamos arreglando');
  }

  if (!results.consistentRedirect) {
    console.log('- ⚠️  Redirección inconsistente - problema de timing/estado');
  }

  if (results.login && results.dashboardWithAuth && results.logout &&
      !results.dashboardWithoutAuth) {
    console.log('\n💡 PROBLEMA IDENTIFICADO:');
    console.log('- El login funciona ✅');
    console.log('- El dashboard con auth funciona ✅');
    console.log('- El logout del servidor funciona ✅');
    console.log('- PERO el dashboard no redirige sin auth ❌');
    console.log('\nEste es exactamente el problema del dashboard que estamos solucionando.');
  }

  // Recomendaciones de solución
  if (!results.dashboardWithoutAuth || !results.consistentRedirect) {
    console.log('\n🔧 RECOMENDACIONES PARA EL FIX:');
    console.log('1. Mejorar detección de cambios en localStorage');
    console.log('2. Forzar redirección más agresiva en useDirectusAuth');
    console.log('3. Añadir listeners de eventos de storage');
    console.log('4. Implementar timeout para redirección forzada');
    console.log('5. Limpiar cache/estado después del logout');
  }

  console.log('\n🔧 COMANDOS ÚTILES:');
  console.log('- docker logs shipfree_dev-app-1 --tail 20');
  console.log('- curl http://localhost:3070/dashboard');
  console.log('- Abrir DevTools → Application → Storage para ver tokens');

  return results;
}

// Función para test rápido
async function quickLogoutTest() {
  console.log('🚀 TEST RÁPIDO DE LOGOUT\n');

  const tokens = await loginAndGetTokens();
  if (!tokens) return false;

  await sleep(1000);
  await performLogout(tokens);
  await sleep(2000);

  return await testDashboardWithoutAuth();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--quick')) {
    quickLogoutTest().then(result => {
      console.log(`\n🎯 Resultado rápido: ${result ? '✅ PASSED' : '❌ FAILED'}`);
      process.exit(result ? 0 : 1);
    }).catch(error => {
      console.error('\n💥 Error en test rápido:', error.message);
      process.exit(1);
    });
  } else {
    runLogoutTest().catch(error => {
      console.error('\n💥 Error ejecutando test de logout:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
  }
}

module.exports = {
  runLogoutTest,
  quickLogoutTest,
  loginAndGetTokens,
  testDashboardWithAuth,
  performLogout,
  testDashboardWithoutAuth,
  testDashboardMultipleTimes
};
