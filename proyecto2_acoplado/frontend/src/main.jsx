import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = 'http://localhost:3000/api';
async function pedir(ruta, opciones={}) {
  const res = await fetch(API + ruta, { credentials:'include', headers:{'Content-Type':'application/json'}, ...opciones });
  const data = await res.json().catch(()=>null);
  if (!res.ok) throw new Error(data?.error || 'Ocurrió un error');
  return data;
}
function Tabla({datos}) {
  if (!datos?.length) return <p>No hay datos para mostrar.</p>;
  const cols = Object.keys(datos[0]);
  return <table><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{datos.map((r,i)=><tr key={i}>{cols.map(c=><td key={c}>{String(r[c])}</td>)}</tr>)}</tbody></table>;
}
function App(){
  const [user,setUser]=useState(null), [page,setPage]=useState('productos'), [error,setError]=useState('');
  useEffect(()=>{pedir('/auth/me').then(setUser).catch(()=>{})},[]);
  async function login(e){e.preventDefault();setError('');try{const f=new FormData(e.target);setUser(await pedir('/auth/login',{method:'POST',body:JSON.stringify({username:f.get('u'),password:f.get('p')})}))}catch(err){setError(err.message)}}
  if(!user) return <main className="login"><h1>Proyecto 2 - Tienda</h1><form onSubmit={login}><input name="u" placeholder="usuario01"/><input name="p" placeholder="secret" type="password"/><button>Iniciar sesión</button></form>{error&&<p className="error">{error}</p>}<p>Usuario de prueba: usuario01 / secret</p></main>;
  return <><nav><b>Tienda Proyecto 2</b>{['productos','clientes','ventas','reportes'].map(x=><button onClick={()=>setPage(x)}>{x}</button>)}<button onClick={()=>pedir('/auth/logout',{method:'POST'}).then(()=>setUser(null))}>Salir</button></nav><main>{page==='productos'&&<Productos/>}{page==='clientes'&&<Clientes/>}{page==='ventas'&&<Ventas/>}{page==='reportes'&&<Reportes/>}</main></>;
}
function Productos(){const [datos,setDatos]=useState([]),[msg,setMsg]=useState(''); const cargar=()=>pedir('/productos').then(setDatos).catch(e=>setMsg(e.message)); useEffect(cargar,[]); async function crear(e){e.preventDefault();setMsg('');const f=new FormData(e.target);try{await pedir('/productos',{method:'POST',body:JSON.stringify({nombre:f.get('nombre'),descripcion:f.get('descripcion'),precio:f.get('precio'),stock:f.get('stock'),id_categoria:f.get('id_categoria'),id_proveedor:f.get('id_proveedor')})});e.target.reset();cargar()}catch(err){setMsg(err.message)}} return <section><h2>CRUD Productos</h2><form onSubmit={crear} className="grid"><input name="nombre" placeholder="Nombre"/><input name="descripcion" placeholder="Descripción"/><input name="precio" placeholder="Precio"/><input name="stock" placeholder="Stock"/><input name="id_categoria" placeholder="ID categoría"/><input name="id_proveedor" placeholder="ID proveedor"/><button>Crear producto</button></form>{msg&&<p className="error">{msg}</p>}<Tabla datos={datos}/></section>}
function Clientes(){const [datos,setDatos]=useState([]),[msg,setMsg]=useState(''); const cargar=()=>pedir('/clientes').then(setDatos).catch(e=>setMsg(e.message)); useEffect(cargar,[]); async function crear(e){e.preventDefault();setMsg('');const f=new FormData(e.target);try{await pedir('/clientes',{method:'POST',body:JSON.stringify({nombre:f.get('nombre'),telefono:f.get('telefono'),correo:f.get('correo'),direccion:f.get('direccion')})});e.target.reset();cargar()}catch(err){setMsg(err.message)}} return <section><h2>CRUD Clientes</h2><form onSubmit={crear} className="grid"><input name="nombre" placeholder="Nombre"/><input name="telefono" placeholder="Teléfono"/><input name="correo" placeholder="Correo"/><input name="direccion" placeholder="Dirección"/><button>Crear cliente</button></form>{msg&&<p className="error">{msg}</p>}<Tabla datos={datos}/></section>}
function Ventas(){const [datos,setDatos]=useState([]),[msg,setMsg]=useState(''); const cargar=()=>pedir('/ventas').then(setDatos).catch(e=>setMsg(e.message)); useEffect(cargar,[]); async function crear(){setMsg('');try{await pedir('/ventas',{method:'POST',body:JSON.stringify({id_cliente:1,id_empleado:1,items:[{id_producto:1,cantidad:1},{id_producto:2,cantidad:1}]})});setMsg('Venta registrada con transacción explícita.');cargar()}catch(e){setMsg(e.message)}} return <section><h2>Ventas</h2><button onClick={crear}>Registrar venta de prueba</button>{msg&&<p>{msg}</p>}<Tabla datos={datos}/></section>}
function Reportes(){const [tipo,setTipo]=useState('join1'),[datos,setDatos]=useState([]),[msg,setMsg]=useState(''); const tipos=['join1','join2','join3','subquery1','subquery2','group','cte','view']; useEffect(()=>{pedir('/reportes/'+tipo).then(setDatos).catch(e=>setMsg(e.message))},[tipo]); return <section><h2>Reportes SQL visibles en UI</h2><select value={tipo} onChange={e=>setTipo(e.target.value)}>{tipos.map(t=><option>{t}</option>)}</select><a className="btn" href={`${API}/reportes/${tipo}/csv`}>Exportar CSV</a>{msg&&<p className="error">{msg}</p>}<Tabla datos={datos}/></section>}
createRoot(document.getElementById('root')).render(<App/>);
