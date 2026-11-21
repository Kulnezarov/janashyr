import {copyFile, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {courses} from '../support-content.js';
import {cities} from '../donor-content.js';

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'dist');
const slug = process.argv[2] || '';
if (slug && !/^[a-z0-9_.-]+$/i.test(slug)) throw new Error('Expected a GitHub repository name');
const prefix = slug ? '/' + slug : '';

const support = 'directions/support';
const donation = 'directions/donation';
const access = 'directions/accessibility';
const city = 'directions/city';
const routes = [
  '', 'account', 'login', 'volunteers', 'organizations', 'about',
  support, ...['psychology','education','education/courses','digital','chat'].map(path => support+'/'+path),
  ...courses.map(([id]) => support+'/education/'+id),
  donation, ...['centers','book','result','info','groups','events'].map(path => donation+'/'+path),
  ...cities.flatMap(([id]) => [donation+'/centers/'+id,donation+'/events/'+id]),
  access, ...['map','obstacle','delivery','discount','volunteer','places'].map(path => access+'/'+path),
  city, ...['map','new','groups','my-groups','events','search'].map(path => city+'/'+path)
];

const template = await readFile(join(root,'index.html'),'utf8');
const html = template.replace(/((?:href|src)=")\/(?!\/)/g,(_,attribute)=>attribute+prefix+'/');
await mkdir(join(output,'assets'),{recursive:true});
const sources = (await readdir(root)).filter(name =>
  name.endsWith('.css') || (name.endsWith('.js') && !name.endsWith('.test.js') && name!=='server.js'));
const assetReferences = new Set(
  (await Promise.all(sources.map(name=>readFile(join(root,name),'utf8'))))
    .concat(template).flatMap(source=>Array.from(source.matchAll(/\bassets\/([\w.-]+)/g), match=>match[1]))
);
const assetFiles=(await readdir(join(root,'assets'),{withFileTypes:true})).filter(entry=>entry.isFile()).map(entry=>entry.name);
const assets=assetFiles.filter(name=>assetReferences.has(name));
await Promise.all([
  ...sources.map(name=>copyFile(join(root,name),join(output,name))),
  ...assets.map(name=>copyFile(join(root,'assets',name),join(output,'assets',name))),
  ...assetFiles.filter(name=>!assetReferences.has(name)).map(name=>rm(join(output,'assets',name),{force:true})),
  ...routes.map(async route=>{
    const directory=join(output,route);
    await mkdir(directory,{recursive:true});
    await writeFile(join(directory,'index.html'),html);
  }),
  writeFile(join(output,'.nojekyll'),''),
  // Local posts and groups have browser-specific IDs. This shell can render
  // their paths even when no static HTML file exists for that particular ID.
  writeFile(join(output,'404.html'),html)
]);
console.log('Static pages prepared for '+(prefix||'/'));
