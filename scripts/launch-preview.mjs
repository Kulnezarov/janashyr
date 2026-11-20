import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

const here = fileURLToPath(new URL('../', import.meta.url));
const script = fileURLToPath(new URL('../server.js', import.meta.url));
const appSource = (await readFile(new URL('../app.js',import.meta.url),'utf8')).replace(/^\uFEFF/,'');
const initialPort = Number(process.env.PORT || 3000);
const ports = Number.isInteger(initialPort) && initialPort >= 1024 && initialPort <= 65525
  ? Array.from({length:11},(_,n)=>initialPort+n)
  : [];
const urls = port => [`http://localhost:${port}`, `http://127.0.0.1:${port}`];

async function isThisProject(url) {
  try {
    const response = await fetch(url+'/app.js',{signal:AbortSignal.timeout(900)});
    if (!response.ok || (await response.text())!==appSource) return false;
    // A local server from an older launch may not serve the current modules.
    const check = await fetch(url+'/profiles.js',{signal:AbortSignal.timeout(900)});
    return check.ok && check.headers.get('content-type')?.includes('javascript');
  } catch {
    return false;
  }
}

function isPortAvailable(port) {
  return new Promise(resolve=>{
    const probe = net.createServer();
    probe.once('error',()=>resolve(false));
    probe.listen(port,()=>probe.close(()=>resolve(true)));
  });
}

function openPreview(url) {
  console.log(`JANASHYR: ${url}/`);
  if (process.env.JANASHYR_PREVIEW_NO_OPEN==='1') return;
  const command = process.platform==='win32'?'explorer.exe':process.platform==='darwin'?'open':'xdg-open';
  const opener = spawn(command,[url+'/'],{stdio:'ignore',detached:true});
  opener.once('error',()=>console.log('Open the address above in your browser.'));
  opener.unref();
}

async function launch() {
  for (const port of ports) {
    for (const url of urls(port)) {
      if (await isThisProject(url)) {
        openPreview(url);
        return;
      }
    }
    if (!(await isPortAvailable(port))) continue;
    const child = spawn(process.execPath,[script],{
      cwd:here, stdio:'inherit', env:{...process.env,PORT:String(port)}
    });
    let failed = false;
    child.once('error',error=>{failed=true;console.error(error.message);});
    child.once('exit',()=>{failed=true;});

    for (let attempt=0; attempt<16 && !failed; attempt++) {
      await delay(180);
      for (const url of urls(port)) {
        if (!(await isThisProject(url))) continue;
        openPreview(url);
        console.log('Press Ctrl+C in this window to stop the local preview.');
        await new Promise(resolve=>{
          if(child.exitCode!==null || failed)resolve();
          else child.once('exit',resolve);
        });
        return;
      }
    }
    if (child.pid && !failed) child.kill();
  }
  throw new Error('Could not start the preview. Check PORT (1024–65525) or free a local port.');
}

try {
  await launch();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
