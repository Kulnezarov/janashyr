// QR Model 2, version 1-L, byte mode. Tickets fit in a single 19-byte data block.
const size=21;
const dataLength=19;
const checkLength=7;

function multiply(a,b) {
  let result=0;
  for(let index=0;index<8;index++){
    if(b&1)result^=a;
    a=(a<<1)^((a&128)?0x11d:0);
    b>>=1;
  }
  return result;
}

function correction(data) {
  let divisor=[1],root=1;
  for(let index=0;index<checkLength;index++){
    divisor=[...divisor,0].map((value,position)=>value^multiply(divisor[position-1] || 0,root));
    root=multiply(root,2);
  }
  const rest=[...data,...Array(checkLength).fill(0)];
  for(let index=0;index<data.length;index++){
    const factor=rest[index];
    divisor.forEach((value,position)=>{rest[index+position]^=multiply(value,factor)});
  }
  return rest.slice(data.length);
}

function codewords(ticket) {
  if(!/^[A-Z0-9-]{1,17}$/.test(ticket))throw new RangeError('Invalid donation ticket');
  const bits=[];
  const append=(value,length)=>{
    for(let index=length-1;index>=0;index--)bits.push((value>>index)&1);
  };
  append(4,4);
  append(ticket.length,8);
  for(const character of ticket)append(character.charCodeAt(0),8);
  append(0,4);
  const bytes=[];
  for(let index=0;index<bits.length;index+=8)bytes.push(parseInt(bits.slice(index,index+8).join(''),2));
  for(let index=0;bytes.length<dataLength;index++)bytes.push(index%2?0x11:0xec);
  return bytes.concat(correction(bytes));
}

export function ticketQrMatrix(ticket) {
  const data=codewords(ticket);
  const matrix=Array.from({length:size},()=>Array(size).fill(null));
  const set=(x,y,dark)=>{if(x>=0 && x<size && y>=0 && y<size)matrix[y][x]=Number(dark)};
  for(const [x,y] of [[3,3],[17,3],[3,17]]){
    for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
      const edge=Math.max(Math.abs(dx),Math.abs(dy));
      set(x+dx,y+dy,edge!==2 && edge!==4);
    }
  }
  for(let index=8;index<13;index++){
    set(index,6,index%2===0);
    set(6,index,index%2===0);
  }
  // The BCH-protected format word for level L and mask 0.
  const format=index=>Boolean((0x77c4>>index)&1);
  for(let index=0;index<6;index++)set(8,index,format(index));
  set(8,7,format(6));
  set(8,8,format(7));
  set(7,8,format(8));
  for(let index=9;index<15;index++)set(14-index,8,format(index));
  for(let index=0;index<8;index++)set(size-1-index,8,format(index));
  for(let index=8;index<15;index++)set(8,size-15+index,format(index));
  set(8,size-8,true);
  let bit=0,up=true;
  for(let x=size-1;x>=1;x-=2){
    if(x===6)x=5;
    for(let offset=0;offset<size;offset++){
      const y=up?size-1-offset:offset;
      for(let dx=0;dx<2;dx++){
        const column=x-dx;
        if(matrix[y][column]!==null)continue;
        const value=(data[bit>>3]>>(7-(bit&7)))&1;
        set(column,y,Boolean(value^Number((column+y)%2===0)));
        bit++;
      }
    }
    up=!up;
  }
  return matrix;
}

export function renderTicketQr(ticket) {
  const path=ticketQrMatrix(ticket).flatMap((row,y)=>row.flatMap((dark,x)=>dark?['M'+(x+4)+' '+(y+4)+'h1v1h-1z']:[])).join('');
  return `<svg class="donor-ticket-qr" width="160" height="160" viewBox="0 0 29 29" shape-rendering="crispEdges" role="img" aria-label="QR: ${ticket}"><rect width="29" height="29" fill="#fff"/><path d="${path}" fill="#151219"/></svg>`;
}
