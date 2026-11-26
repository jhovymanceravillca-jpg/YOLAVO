// "npm run dev" en la carpeta principal arranca el backend y el frontend juntos
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const procesos = ['Backend', 'FrontEnd'].map((carpeta) => {
  if (!existsSync(`${carpeta}/node_modules`)) {
    console.error(`Faltan las dependencias de ${carpeta}. Ejecuta: npm run instalar`);
    process.exit(1);
  }
  return spawn('npm run dev', { cwd: carpeta, stdio: 'inherit', shell: true });
});

const cerrar = () => procesos.forEach((p) => p.kill());
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
procesos.forEach((p) => p.on('exit', (codigo) => { if (codigo) { cerrar(); process.exitCode = codigo; } }));
