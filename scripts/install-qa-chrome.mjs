// Install full Chrome for Testing matched to the pinned puppeteer-core release.
import {createRequire} from 'node:module';
import {appendFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {install,Browser}=require('@puppeteer/browsers');
const {PUPPETEER_REVISIONS}=require('puppeteer-core');
const buildId=PUPPETEER_REVISIONS.chrome;
const cacheDir=join(process.env.RUNNER_TEMP||tmpdir(),'noata-chrome-for-testing');
await mkdir('artifacts/noata-browser',{recursive:true});
try{
  const installed=await install({browser:Browser.CHROME,buildId,cacheDir});
  const version=spawnSync(installed.executablePath,['--version'],{encoding:'utf8'});
  if(version.status!==0)throw Error('Installed Chrome --version failed: '+version.stderr);
  await writeFile('artifacts/noata-browser/browser-install.json',JSON.stringify({buildId,executablePath:installed.executablePath,version:version.stdout.trim()},null,2));
  if(process.env.GITHUB_ENV)await appendFile(process.env.GITHUB_ENV,`NOATA_CHROMIUM_PATH=${installed.executablePath}\n`);
  console.log(`Installed full Chrome for Testing ${buildId}: ${installed.executablePath}`);
}catch(error){
  await writeFile('artifacts/noata-browser/browser-install.json',JSON.stringify({buildId,failed:true,message:error.message,stack:error.stack},null,2));
  throw error;
}
