// Dedicated PostgreSQL lifecycle. Never reads/opens the previous cluster.
import { spawn, fork } from 'node:child_process';
import { mkdir, writeFile, readFile, unlink, realpath } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import assert from 'node:assert/strict';
import pg from 'pg';
const root=process.cwd(), run=`cluster_${Date.now()}_${randomBytes(3).toString('hex')}`;
const logicalDirectory=`.local/rr03-b-clusters/${run}`,directory=resolve(root,logicalDirectory),data=resolve(directory,'data');
const bin=resolve(root,'.local/runtimes/postgresql-18.6/pgsql/bin');
const reviews=resolve(root,'_bmad-output/planning-artifacts/architecture/architecture-Proyecto-Desarrollo-2026-09-11/reviews');
const evidencePath=resolve(reviews,`rr03-evidence/${run}.json`);
const evidence={run,logicalDirectory,oldClusterPort:54329,oldClusterUsed:false,checks:[],lifecycle:[],status:'running'};
const password=randomBytes(32).toString('hex'),username=`rr03b_${randomBytes(6).toString('hex')}`;
let started=false,connection;
const save=()=>writeFile(evidencePath,JSON.stringify(evidence,null,2));
async function binary(name,args){return new Promise((done,reject)=>{
  const child=spawn(resolve(bin,name+'.exe'),args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
  child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject);
  child.on('exit',code=>done({code,stdout:stdout.replaceAll(password,'[REDACTED]'),stderr:stderr.replaceAll(password,'[REDACTED]')}));
});}
async function start(){const result=await binary('pg_ctl',['-D',data,'-l',resolve(directory,'server.log'),'-o',`-h 127.0.0.1 -p ${evidence.port}`,'-w','start']);evidence.lifecycle.push({action:'start',at:new Date().toISOString(),...result});assert.equal(result.code,0);started=true;await save();}
async function stop(){const result=await binary('pg_ctl',['-D',data,'-m','fast','-w','stop']);evidence.lifecycle.push({action:'stop',at:new Date().toISOString(),...result});assert.equal(result.code,0);started=false;await save();}
try{
  const expected=resolve(root,'.local/rr03-b-clusters');assert.ok(directory.startsWith(expected+sep));assert.notEqual(data,resolve(root,'.local/postgres/data'));
  await mkdir(directory,{recursive:true});await save();
  const version=await binary('postgres',['--version']);assert.equal(version.code,0);assert.match(version.stdout,/18\.6/);evidence.binaryVersion=version.stdout.trim();
  const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));evidence.port=listener.address().port;await new Promise(r=>listener.close(r));assert.notEqual(evidence.port,54329);
  const passFile=resolve(directory,'init-password.tmp');await writeFile(passFile,password,{mode:0o600});
  let init;try{init=await binary('initdb',['-D',data,'-U',username,'--pwfile='+passFile,'--auth=scram-sha-256','--encoding=UTF8','--locale=C']);}finally{await unlink(passFile)}
  evidence.lifecycle.push({action:'initdb',...init});assert.equal(init.code,0);await start();
  const database={host:'127.0.0.1',port:evidence.port,user:username,password};
  await writeFile(resolve(directory,'connection.json'),JSON.stringify(database),{mode:0o600});evidence.privateCredentialFile=logicalDirectory+'/connection.json';
  connection=new pg.Client({...database,database:'postgres'});await connection.connect();
  const actual=(await connection.query('SHOW data_directory')).rows[0].data_directory;
  assert.equal((await realpath(actual)).toLowerCase(),(await realpath(data)).toLowerCase());
  assert.equal(Number((await connection.query('SHOW port')).rows[0].port),evidence.port);
  evidence.serverVersion=(await connection.query('SHOW server_version')).rows[0].server_version;
  await connection.query('CREATE DATABASE rr03b_infra_probe');await connection.end();
  connection=new pg.Client({...database,database:'rr03b_infra_probe'});await connection.connect();
  await connection.query('CREATE TABLE durability(id integer PRIMARY KEY,value text NOT NULL)');
  await connection.query("INSERT INTO durability VALUES(1,'created'),(2,'delete-me')");
  assert.equal((await connection.query('SELECT value FROM durability WHERE id=1')).rows[0].value,'created');
  await connection.query("UPDATE durability SET value='survives-restart' WHERE id=1");await connection.query('DELETE FROM durability WHERE id=2');
  assert.equal((await connection.query('SELECT count(*)::int n FROM durability')).rows[0].n,1);evidence.checks.push({name:'connect-create-read-update-delete',status:'PASS'});
  await connection.end();connection=undefined;await stop();await start();
  connection=new pg.Client({...database,database:'rr03b_infra_probe'});await connection.connect();
  assert.deepEqual((await connection.query('SELECT id,value FROM durability ORDER BY id')).rows,[{id:1,value:'survives-restart'}]);
  evidence.checks.push({name:'cluster-restart-durable-data',status:'PASS'});await connection.end();connection=undefined;await save();
  const worker=fork(fileURLToPath(new URL('./run.mjs',import.meta.url)),[],{execPath:process.execPath,windowsHide:true,stdio:['ignore','pipe','pipe','ipc'],env:{SystemRoot:process.env.SystemRoot,PATH:process.env.PATH,RR03_B_SCENARIOS:process.env.RR03_B_SCENARIOS||''}});
  worker.stdout.on('data',b=>{const s=String(b);process.stdout.write(s);(evidence.harnessOutput??=[]).push(s.trim())});
  worker.stderr.on('data',b=>{(evidence.harnessErrors??=[]).push(String(b).replaceAll(password,'[REDACTED]').slice(0,2000))});
  worker.on('message',m=>{if(m.type==='config-ready')worker.send({type:'isolated-cluster',database,logicalDirectory})});
  evidence.harnessExitCode=await new Promise(r=>worker.once('exit',r));evidence.status=evidence.harnessExitCode===0?'PASS':'HARNESS_FAILED';
}catch(error){evidence.status='INFRASTRUCTURE_FAIL';evidence.error=String(error.message).replaceAll(password,'[REDACTED]');process.exitCode=1;}
finally{
  if(connection)await connection.end().catch(()=>{});
  if(started){try{await stop()}catch{evidence.stopFailed=true}}
  evidence.finalState=started?'STOP_NOT_VERIFIED':'STOPPED_PRESERVED';evidence.credentialsInEvidence=false;evidence.finishedAt=new Date().toISOString();await save();
  console.log(`CLUSTER ${evidence.status} ${evidence.finalState}: ${relative(root,evidencePath)}`);
  if(evidence.status!=='PASS')process.exitCode=1;
}
