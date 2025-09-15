const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

async function checkPorts() {
  console.log('🔍 Verificando disponibilidad de puertos...\n');
  
  const ports = [3001, 5173];
  
  for (const port of ports) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      console.log(`✅ Puerto ${port}: Disponible`);
    } else {
      console.log(`❌ Puerto ${port}: En uso`);
      console.log(`   Para liberar el puerto, ejecuta:`);
      console.log(`   netstat -ano | findstr :${port}`);
      console.log(`   taskkill /PID <PID> /F`);
    }
  }
  
  console.log('\n📋 Instrucciones:');
  console.log('1. Si algún puerto está en uso, libéralo usando los comandos de arriba');
  console.log('2. Ejecuta: npm run dev:clean');
  console.log('3. En otra terminal, ejecuta: cd server && npm start');
}

checkPorts();
