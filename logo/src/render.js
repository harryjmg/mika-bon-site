const {Resvg}=require('@resvg/resvg-js');const fs=require('fs');
const [,,inp,out,size,bg]=process.argv;
const svg=fs.readFileSync(inp,'utf8');
const m=svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const fit = m[2]>=m[3]?{mode:'width',value:+size}:{mode:'height',value:+size};
const r=new Resvg(svg,{fitTo:fit,background:bg||undefined});
fs.writeFileSync(out,r.render().asPng());
