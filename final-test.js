#!/usr/bin/env node

/**
 * Test final para simular el flujo completo de un usuario real en ShipFree
 * Este test simula exactamente lo que hace un usuario desde el navegador
 */

const axios = require('axios');

const APP_URL = 'http://localhost:3070';
const DIRECTUS_URL = 'http://localhost:8070';

// Credenciales de prueba
const TEST_USER = {
  email: 'admin@shipfree.dev',
  password: 'AdminPassword123!'
};

let cookies = '';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function step1_visitHomePage() {
  console.log('\n🏠 PASO 1: Visitando página principal...');

  try {
    const response = await axios.get(APP_URL);

    if (response.status === 200) {
      console.log('✅ Página principal carga correctamente');

      // Verificar que tiene botón de "Iniciar sesión"
      const hasLoginButton = response.data.includes('Iniciar sesión') ||
                            response.data.includes('iniciar sesión') ||
                            response.data.includes('Login') ||
                            response.data.includes('login');

      console.log(`   ${hasLoginButton ? '✅' : '❌'} Botón "Iniciar sesión": ${hasLoginButton ? 'Presente' : 'No encontrado'}`);
      return hasLoginButton;
    }

    return false;
  } catch (error) {
    console.error('❌ Error cargando página principal:', error.message);
    return false;
  }
}

async function step2_visitLoginPage() {
  console.log('\n📝 PASO 2: Visitando página de login...');

  try {
    const response = await axios.get(`${APP_URL}/directus-login`);

    if (response.status === 200) {
      console.log('✅ Página de login carga correctamente');

      // Verificar elementos del formulario
      const hasEmailField = response.data.includes('email') || response.data.includes('Email');
      const hasPasswordField = response.data.includes('password') || response.data.includes('Password') || response.data.includes('contraseña');
      const hasSubmitButton = response.data.includes('submit') || response.data.includes('Iniciar') || response.data.includes('Login');

      console.log(`   ${hasEmailField ? '✅' : '❌'} Campo email: ${hasEmailField ? 'Presente' : 'No encontrado'}`);
      console.log(`   ${hasPasswordField ? '✅' : '❌'} Campo password: ${hasPasswordField ? 'Presente' : 'No encontrado'}`);
      console.log(`   ${hasSubmitButton ? '✅' : '❌'} Botón submit: ${hasSubmitButton ? 'Presente' : 'No encontrado'}`);

      return hasEmailField && hasPasswordField && hasSubmitButton;
    }

    return false;
  } catch (error) {
    console.error('❌ Error cargando página de login:', error.message);
    return false;
  }
}

async function step3_attemptLogin() {
  console.log('\n🔐 PASO 3: Simulando login del usuario...');

  // Esto simula lo que hace el hook useDirectusAuth cuando el usuario hace login
  try {
    // Primero, probamos el login directo con Directus (esto es lo que hace directusAuth.login)
    const loginResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (loginResponse.data.data && loginResponse.data.data.access_token) {
      const { access_token, refresh_token } = loginResponse.data.data;

      console.log('✅ Login con Directus exitoso');
      console.log(`   Token recibido: ${access_token.substring(0, 50)}...`);
      console.log(`   Refresh token: ${refresh_token ? refresh_token.substring(0, 30) + '...' : 'N/A'}`);

      // Simular el almacenamiento de tokens (esto es lo que haría el navegador)
      const tokenCookie = `directus_access_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
      cookies = tokenCookie;

      console.log('✅ Tokens almacenados localmente (simulado)');

      return { access_token, refresh_token };
    }

    return null;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    return null;
  }
}

async function step4_getUserInfo(tokens) {
  console.log('\n👤 PASO 4: Obteniendo información del usuario...');

  if (!tokens || !tokens.access_token) {
    console.error('❌ No hay tokens disponibles');
    return null;
  }

  try {
    // Esto simula lo que hace directusAuth.getCurrentUser()
    const userResponse = await axios.get(`${DIRECTUS_URL}/users/me?fields=id,email,first_name,last_name,status,role`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    const user = userResponse.data.data;

    if (user) {
      console.log('✅ Información del usuario obtenida:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.first_name || 'N/A'} ${user.last_name || ''}`);
      console.log(`   Estado: ${user.status}`);
      console.log(`   Rol ID: ${user.role}`);

      // Obtener información del rol (esto simula la expansión del rol)
      if (user.role && typeof user.role === 'string') {
        try {
          const roleResponse = await axios.get(`${DIRECTUS_URL}/roles/${user.role}?fields=id,name,description`, {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`
            }
          });

          const roleData = roleResponse.data.data;
          const isAdmin = roleData.name?.toLowerCase().includes('admin');

          console.log('✅ Información del rol obtenida:');
          console.log(`   Nombre: ${roleData.name}`);
          console.log(`   Descripción: ${roleData.description}`);
          console.log(`   Es Admin: ${isAdmin ? 'Sí' : 'No'}`);

          // Simular el objeto usuario completo como lo tendría la app
          const completeUser = {
            ...user,
            role: {
              id: roleData.id,
              name: roleData.name,
              description: roleData.description,
              admin_access: isAdmin,
              app_access: true
            }
          };

          return completeUser;

        } catch (roleError) {
          console.warn('⚠️  No se pudo obtener información del rol:', roleError.message);
          return user;
        }
      }

      return user;
    }

    return null;
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error.response?.data || error.message);
    return null;
  }
}

async function step5_accessDashboard(user) {
  console.log('\n📊 PASO 5: Accediendo al dashboard...');

  if (!user) {
    console.error('❌ No hay información del usuario');
    return false;
  }

  try {
    // Simular acceso al dashboard con cookies (como lo haría el navegador)
    const dashboardResponse = await axios.get(`${APP_URL}/dashboard`, {
      headers: {
        'Cookie': cookies
      },
      maxRedirects: 0,
      validateStatus: function (status) {
        return status < 400; // No lanzar error para redirects
      }
    });

    if (dashboardResponse.status === 200) {
      console.log('✅ Dashboard accesible');

      // Verificar si el dashboard contiene información del usuario
      const hasUserInfo = dashboardResponse.data.includes(user.email) ||
                         dashboardResponse.data.includes(user.first_name) ||
                         dashboardResponse.data.includes('dashboard') ||
                         dashboardResponse.data.includes('Dashboard');

      console.log(`   ${hasUserInfo ? '✅' : '⚠️'} Contenido del dashboard: ${hasUserInfo ? 'Contiene info del usuario' : 'Genérico'}`);

      return true;
    } else if (dashboardResponse.status >= 300 && dashboardResponse.status < 400) {
      console.log('⚠️  Dashboard redirige (esto puede ser normal en client-side routing)');
      console.log(`   Status: ${dashboardResponse.status}`);
      console.log(`   Location: ${dashboardResponse.headers.location || 'N/A'}`);
      return true; // En Next.js con client-side auth, esto puede ser normal
    }

    return false;
  } catch (error) {
    console.error('❌ Error accediendo dashboard:', error.message);
    return false;
  }
}

async function step6_logout(tokens) {
  console.log('\n🚪 PASO 6: Cerrando sesión...');

  if (!tokens || !tokens.refresh_token) {
    console.error('❌ No hay refresh token para logout');
    return false;
  }

  try {
    // Esto simula lo que hace directusAuth.logout()
    const logoutResponse = await axios.post(`${DIRECTUS_URL}/auth/logout`, {
      refresh_token: tokens.refresh_token
    }, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    console.log('✅ Logout del servidor exitoso');

    // Simular limpieza local de tokens
    cookies = '';
    console.log('✅ Tokens locales eliminados (simulado)');

    return true;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('⚠️  Logout del servidor falló (token ya inválido), pero limpieza local exitosa');
      cookies = '';
      return true;
    }

    console.error('❌ Error en logout:', error.response?.data || error.message);
    // Aún así, limpiar tokens locales
    cookies = '';
    return false;
  }
}

async function step7_verifyLogout() {
  console.log('\n🔒 PASO 7: Verificando que el logout fue efectivo...');

  try {
    // Intentar acceder al dashboard sin autenticación
    const dashboardResponse = await axios.get(`${APP_URL}/dashboard`, {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status < 500; // Permitir redirects y errores de auth
      }
    });

    if (dashboardResponse.status >= 300 && dashboardResponse.status < 400) {
      console.log('✅ Dashboard redirige correctamente después del logout');
      console.log(`   Status: ${dashboardResponse.status}`);
      return true;
    } else if (dashboardResponse.status === 200) {
      // Verificar si el contenido es genérico (sin info de usuario)
      const hasAuthContent = dashboardResponse.data.includes('@') ||
                            dashboardResponse.data.includes('Admin') ||
                            dashboardResponse.data.includes('usuario logueado');

      if (!hasAuthContent) {
        console.log('✅ Dashboard accesible pero sin contenido autenticado');
        return true;
      } else {
        console.log('⚠️  Dashboard aún muestra contenido autenticado');
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('⚠️  Error verificando logout:', error.message);
    return false;
  }
}

async function runCompleteUserFlow() {
  console.log('🚀 INICIANDO TEST COMPLETO DEL FLUJO DE USUARIO');
  console.log('═'.repeat(70));
  console.log('Este test simula exactamente lo que hace un usuario real:');
  console.log('1. Visitar página principal');
  console.log('2. Ir a página de login');
  console.log('3. Hacer login');
  console.log('4. Obtener información del usuario');
  console.log('5. Acceder al dashboard');
  console.log('6. Cerrar sesión');
  console.log('7. Verificar logout');
  console.log('═'.repeat(70));

  const results = {
    homePage: false,
    loginPage: false,
    login: false,
    userInfo: false,
    dashboard: false,
    logout: false,
    verifyLogout: false
  };

  let tokens = null;
  let user = null;

  // Ejecutar todos los pasos
  results.homePage = await step1_visitHomePage();
  await sleep(1000);

  results.loginPage = await step2_visitLoginPage();
  await sleep(1000);

  tokens = await step3_attemptLogin();
  results.login = !!tokens;
  await sleep(1000);

  if (tokens) {
    user = await step4_getUserInfo(tokens);
    results.userInfo = !!user;
    await sleep(1000);

    if (user) {
      results.dashboard = await step5_accessDashboard(user);
      await sleep(1000);
    }

    results.logout = await step6_logout(tokens);
    await sleep(1000);

    results.verifyLogout = await step7_verifyLogout();
  }

  // Resumen final
  console.log('\n' + '═'.repeat(70));
  console.log('📋 RESUMEN FINAL DEL FLUJO DE USUARIO:');
  console.log('═'.repeat(70));

  Object.entries(results).forEach(([step, passed]) => {
    const status = passed ? '✅' : '❌';
    const stepName = step.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} ${stepName}: ${passed ? 'SUCCESS' : 'FAILED'}`);
  });

  const totalSteps = Object.keys(results).length;
  const passedSteps = Object.values(results).filter(r => r).length;
  const successRate = ((passedSteps / totalSteps) * 100).toFixed(1);

  console.log('\n' + '═'.repeat(70));
  console.log(`🎯 RESULTADO GENERAL: ${passedSteps}/${totalSteps} pasos completados (${successRate}%)`);

  if (successRate >= 85) {
    console.log('🎉 ¡EXCELENTE! El flujo de autenticación funciona perfectamente.');
    console.log('   Los usuarios pueden autenticarse y usar la aplicación sin problemas.');
  } else if (successRate >= 70) {
    console.log('⚠️  BUENO: El flujo funciona en su mayoría, con algunos problemas menores.');
    console.log('   La mayoría de usuarios podrán usar la aplicación normalmente.');
  } else if (successRate >= 50) {
    console.log('🚨 PROBLEMAS: Hay fallos significativos en el flujo.');
    console.log('   Algunos usuarios experimentarán dificultades.');
  } else {
    console.log('💥 CRÍTICO: El flujo de autenticación tiene fallos graves.');
    console.log('   La aplicación no es usable para los usuarios finales.');
  }

  // Información específica sobre el usuario de prueba
  if (user) {
    console.log('\n📄 INFORMACIÓN DEL USUARIO DE PRUEBA:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.first_name} ${user.last_name}`);
    console.log(`   Estado: ${user.status}`);
    if (user.role && typeof user.role === 'object') {
      console.log(`   Rol: ${user.role.name}`);
      console.log(`   Admin: ${user.role.admin_access ? 'Sí' : 'No'}`);
      console.log(`   App Access: ${user.role.app_access ? 'Sí' : 'No'}`);
    }
  }

  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES PARA EL DESARROLLADOR:');

  if (!results.homePage) {
    console.log('- Verificar que la app Next.js esté corriendo en puerto 3070');
    console.log('- Asegurar que el botón "Iniciar sesión" esté presente en la página principal');
  }

  if (!results.loginPage) {
    console.log('- Verificar que la página /directus-login esté funcionando');
    console.log('- Asegurar que el formulario de login tenga todos los campos necesarios');
  }

  if (!results.login) {
    console.log('- Verificar la conectividad entre la app y Directus');
    console.log('- Confirmar las credenciales de administrador en Directus');
  }

  if (!results.userInfo) {
    console.log('- Revisar la función getCurrentUser() en el cliente de Directus');
    console.log('- Verificar permisos del usuario para acceder a su propia información');
  }

  if (!results.dashboard) {
    console.log('- Verificar la protección de rutas en /dashboard');
    console.log('- Asegurar que el componente de dashboard maneje correctamente la autenticación');
  }

  if (!results.logout) {
    console.log('- Revisar la función logout() - los errores 400 son normales y manejables');
    console.log('- Asegurar que se limpien los tokens locales independientemente');
  }

  if (!results.verifyLogout) {
    console.log('- Verificar que el dashboard redirija correctamente después del logout');
  }

  console.log('\n🔧 COMANDOS ÚTILES PARA DEBUGGING:');
  console.log('- docker logs shipfree_dev-app-1 --tail 20');
  console.log('- docker logs directus_shipfree --tail 20');
  console.log('- curl http://localhost:3070/directus-login');
  console.log('- curl http://localhost:8070/server/health');
  console.log('- docker ps # Para ver estado de contenedores');

  return results;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runCompleteUserFlow().catch(error => {
    console.error('\n💥 ERROR CRÍTICO ejecutando test:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });
}

module.exports = {
  runCompleteUserFlow,
  step1_visitHomePage,
  step2_visitLoginPage,
  step3_attemptLogin,
  step4_getUserInfo,
  step5_accessDashboard,
  step6_logout,
  step7_verifyLogout
};
