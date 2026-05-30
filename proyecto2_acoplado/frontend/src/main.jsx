import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

const BASE = 'http://localhost:3000/api'

async function llamar(ruta, opciones = {}) {
  const res = await fetch(BASE + ruta, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opciones
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || 'Algo salio mal')
  return data
}

// Qué puede ver cada rol
const PERMISOS = {
  admin:    ['productos', 'clientes', 'ventas', 'reportes', 'stock'],
  vendedor: ['productos', 'clientes', 'ventas', 'reportes'],
  cajero:   ['clientes', 'ventas'],
  bodega:   ['productos', 'stock'],
  auditor:  ['reportes']
}

function App() {
  const [usuario, setUsuario] = useState(null)
  const [pagina, setPagina]   = useState(null)
  const [errorLogin, setErrorLogin] = useState('')

  useEffect(() => {
    llamar('/auth/me')
      .then(u => {
        if (u) {
          setUsuario(u)
          const perms = PERMISOS[u.rol] || []
          setPagina(perms[0] || 'productos')
        }
      })
      .catch(() => {})
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setErrorLogin('')
    const form = new FormData(e.target)
    try {
      const u = await llamar('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: form.get('username'),
          password: form.get('password')
        })
      })
      setUsuario(u)
      const perms = PERMISOS[u.rol] || []
      setPagina(perms[0] || 'productos')
    } catch (err) {
      setErrorLogin(err.message)
    }
  }

  async function handleLogout() {
    await llamar('/auth/logout', { method: 'POST' })
    setUsuario(null)
    setPagina(null)
  }

  if (!usuario) {
    return (
      <div className="login-wrap">
        <div className="login-box">
          <h1>Tienda - Proyecto 3</h1>
          <p className="login-sub">Ingresa tus credenciales para continuar</p>
          <form onSubmit={handleLogin}>
            <div className="campo">
              <label>Usuario</label>
              <input name="username" defaultValue="proy3" />
            </div>
            <div className="campo">
              <label>Contraseña</label>
              <input name="password" type="password" defaultValue="secret" />
            </div>
            <button type="submit" className="btn-primary">Entrar</button>
          </form>
          {errorLogin && <p className="error-msg">{errorLogin}</p>}
          <p className="login-sub" style={{marginTop:'12px'}}>
            Roles disponibles: admin, vendedor, cajero, bodega, auditor
          </p>
        </div>
      </div>
    )
  }

  const permsUsuario = PERMISOS[usuario.rol] || []

  const etiquetas = {
    productos: 'Productos',
    clientes:  'Clientes',
    ventas:    'Ventas',
    reportes:  'Reportes',
    stock:     'Stock'
  }

  return (
    <div>
      <nav className="navbar">
        <span className="nav-titulo">Tienda Proyecto 3</span>
        <div className="nav-links">
          {permsUsuario.map(p => (
            <button key={p}
              onClick={() => setPagina(p)}
              className={pagina === p ? 'nav-btn activo' : 'nav-btn'}>
              {etiquetas[p]}
            </button>
          ))}
        </div>
        <span className="nav-user">
          {usuario.nombre} <span className="rol-badge">{usuario.rol}</span>
          &nbsp;
          <button onClick={handleLogout} className="btn-salir">Salir</button>
        </span>
      </nav>

      <div className="contenido">
        {pagina === 'productos' && <Productos usuario={usuario} />}
        {pagina === 'clientes'  && <Clientes  usuario={usuario} />}
        {pagina === 'ventas'    && <Ventas    usuario={usuario} />}
        {pagina === 'reportes'  && <Reportes  usuario={usuario} />}
        {pagina === 'stock'     && <Stock     usuario={usuario} />}
      </div>
    </div>
  )
}

// ---- PRODUCTOS ----
function Productos({ usuario }) {
  const [lista,    setLista]    = useState([])
  const [mensaje,  setMensaje]  = useState('')
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    nombre: '', descripcion: '', precio: '', stock: '', id_categoria: '', id_proveedor: ''
  })

  const puedeEditar  = ['admin', 'vendedor'].includes(usuario.rol)
  const puedeEliminar = usuario.rol === 'admin'

  useEffect(() => { cargar() }, [])

  function cargar() {
    llamar('/productos').then(setLista).catch(e => setMensaje(e.message))
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleCrear(e) {
    e.preventDefault(); setMensaje('')
    try {
      await llamar('/productos', { method: 'POST', body: JSON.stringify(form) })
      setForm({ nombre:'', descripcion:'', precio:'', stock:'', id_categoria:'', id_proveedor:'' })
      setMensaje('Producto creado correctamente')
      cargar()
    } catch (err) { setMensaje('Error: ' + err.message) }
  }

  async function guardarEdicion() {
    setMensaje('')
    try {
      await llamar('/productos/' + editando.id_producto, {
        method: 'PUT',
        body: JSON.stringify({ ...editando })
      })
      setEditando(null); setMensaje('Producto actualizado'); cargar()
    } catch (err) { setMensaje('Error al editar: ' + err.message) }
  }

  async function eliminar(id) {
    if (!confirm('¿Seguro que deseas desactivar este producto?')) return
    setMensaje('')
    try {
      await llamar('/productos/' + id, { method: 'DELETE' })
      setMensaje('Producto desactivado'); cargar()
    } catch (err) { setMensaje('Error: ' + err.message) }
  }

  return (
    <div className="seccion">
      <h2>Productos</h2>

      {editando && (
        <div className="modal-fondo">
          <div className="modal">
            <h3>Editar producto</h3>
            {['nombre','descripcion','precio','stock'].map(f => (
              <div className="campo" key={f}>
                <label>{f.charAt(0).toUpperCase()+f.slice(1)}</label>
                <input value={editando[f]} onChange={e => setEditando({...editando,[f]:e.target.value})} />
              </div>
            ))}
            <div className="modal-botones">
              <button onClick={guardarEdicion} className="btn-primary">Guardar</button>
              <button onClick={() => setEditando(null)} className="btn-cancel">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {puedeEditar && (
        <div className="card">
          <h3>Agregar nuevo producto</h3>
          <form onSubmit={handleCrear} className="form-grid">
            {['nombre','descripcion','precio','stock','id_categoria','id_proveedor'].map(f => (
              <div className="campo" key={f}>
                <label>{f}</label>
                <input name={f} value={form[f]} onChange={handleChange} />
              </div>
            ))}
            <button type="submit" className="btn-primary">Crear producto</button>
          </form>
          {mensaje && <p className={mensaje.startsWith('Error') ? 'error-msg' : 'ok-msg'}>{mensaje}</p>}
        </div>
      )}

      <div className="card">
        <h3>Lista de productos</h3>
        {!puedeEditar && mensaje && <p className={mensaje.startsWith('Error') ? 'error-msg' : 'ok-msg'}>{mensaje}</p>}
        <div className="tabla-wrap">
          <table>
            <thead><tr>
              <th>ID</th><th>Nombre</th><th>Categoría</th><th>Proveedor</th>
              <th>Precio</th><th>Stock</th><th>Activo</th>
              {(puedeEditar || puedeEliminar) && <th>Acciones</th>}
            </tr></thead>
            <tbody>
              {lista.map(p => (
                <tr key={p.id_producto}>
                  <td>{p.id_producto}</td><td>{p.nombre}</td>
                  <td>{p.categoria}</td><td>{p.proveedor}</td>
                  <td>Q{p.precio}</td><td>{p.stock}</td>
                  <td>{p.activo ? 'Sí' : 'No'}</td>
                  {(puedeEditar || puedeEliminar) && (
                    <td>
                      {puedeEditar   && <button onClick={() => setEditando(p)} className="btn-edit">Editar</button>}
                      {puedeEliminar && <button onClick={() => eliminar(p.id_producto)} className="btn-del">Eliminar</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---- CLIENTES ----
function Clientes({ usuario }) {
  const [lista,    setLista]    = useState([])
  const [mensaje,  setMensaje]  = useState('')
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre:'', telefono:'', correo:'', direccion:'' })

  const puedeEditar  = ['admin','vendedor','cajero'].includes(usuario.rol)
  const puedeEliminar = usuario.rol === 'admin'

  useEffect(() => { cargar() }, [])
  function cargar() { llamar('/clientes').then(setLista).catch(e => setMensaje(e.message)) }
  function handleChange(e) { setForm({...form,[e.target.name]:e.target.value}) }

  async function handleCrear(e) {
    e.preventDefault(); setMensaje('')
    try {
      await llamar('/clientes', { method:'POST', body:JSON.stringify(form) })
      setForm({ nombre:'', telefono:'', correo:'', direccion:'' })
      setMensaje('Cliente agregado'); cargar()
    } catch (err) { setMensaje('Error: ' + err.message) }
  }

  async function guardarEdicion() {
    setMensaje('')
    try {
      await llamar('/clientes/' + editando.id_cliente, {
        method:'PUT', body:JSON.stringify(editando)
      })
      setEditando(null); setMensaje('Cliente actualizado'); cargar()
    } catch (err) { setMensaje('Error: ' + err.message) }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este cliente?')) return
    try {
      await llamar('/clientes/' + id, { method:'DELETE' })
      setMensaje('Cliente eliminado'); cargar()
    } catch (err) { setMensaje('Error: ' + err.message) }
  }

  return (
    <div className="seccion">
      <h2>Clientes</h2>

      {editando && (
        <div className="modal-fondo"><div className="modal">
          <h3>Editar cliente</h3>
          {['nombre','telefono','correo','direccion'].map(f => (
            <div className="campo" key={f}>
              <label>{f}</label>
              <input value={editando[f]} onChange={e => setEditando({...editando,[f]:e.target.value})} />
            </div>
          ))}
          <div className="modal-botones">
            <button onClick={guardarEdicion} className="btn-primary">Guardar</button>
            <button onClick={() => setEditando(null)} className="btn-cancel">Cancelar</button>
          </div>
        </div></div>
      )}

      {puedeEditar && (
        <div className="card">
          <h3>Agregar cliente</h3>
          <form onSubmit={handleCrear} className="form-grid">
            {['nombre','telefono','correo','direccion'].map(f => (
              <div className="campo" key={f}><label>{f}</label>
                <input name={f} value={form[f]} onChange={handleChange} /></div>
            ))}
            <button type="submit" className="btn-primary">Agregar</button>
          </form>
          {mensaje && <p className={mensaje.startsWith('Error') ? 'error-msg' : 'ok-msg'}>{mensaje}</p>}
        </div>
      )}

      <div className="card">
        <h3>Lista de clientes</h3>
        <div className="tabla-wrap"><table>
          <thead><tr>
            <th>ID</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Dirección</th>
            {(puedeEditar||puedeEliminar) && <th>Acciones</th>}
          </tr></thead>
          <tbody>
            {lista.map(c => (
              <tr key={c.id_cliente}>
                <td>{c.id_cliente}</td><td>{c.nombre}</td>
                <td>{c.telefono}</td><td>{c.correo}</td><td>{c.direccion}</td>
                {(puedeEditar||puedeEliminar) && (
                  <td>
                    {puedeEditar   && <button onClick={() => setEditando(c)} className="btn-edit">Editar</button>}
                    {puedeEliminar && <button onClick={() => eliminar(c.id_cliente)} className="btn-del">Eliminar</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}

// ---- VENTAS ----
function Ventas({ usuario }) {
  const [lista,     setLista]     = useState([])
  const [mensaje,   setMensaje]   = useState('')
  const [idCliente, setIdCliente] = useState('')
  const [items,     setItems]     = useState([{ id_producto:'', cantidad:'' }])

  const puedeRegistrar = ['admin','vendedor','cajero'].includes(usuario.rol)
  const puedeCancelar  = usuario.rol === 'admin'

  useEffect(() => { cargar() }, [])
  function cargar() { llamar('/ventas').then(setLista).catch(e => setMensaje(e.message)) }

  function agregarItem() { setItems([...items, { id_producto:'', cantidad:'' }]) }
  function cambiarItem(i, campo, val) {
    const copia = [...items]; copia[i][campo] = val; setItems(copia)
  }

  async function registrarVenta() {
    setMensaje('')
    if (!idCliente) { setMensaje('Error: ingresa el ID del cliente'); return }
    try {
      const res = await llamar('/ventas', {
        method:'POST',
        body: JSON.stringify({ id_cliente:idCliente, id_empleado:usuario.id_empleado, items })
      })
      setMensaje('Venta registrada. Total: Q' + res.total)
      setIdCliente(''); setItems([{ id_producto:'', cantidad:'' }]); cargar()
    } catch (err) { setMensaje('Error: ' + err.message) }
  }

  async function cancelarVenta(id) {
    if (!confirm('¿Cancelar esta venta?')) return
    try {
      await llamar('/ventas/' + id + '/cancelar', {
        method:'PATCH', body: JSON.stringify({ id_empleado: usuario.id_empleado })
      })
      setMensaje('Venta cancelada'); cargar()
    } catch (err) { setMensaje('Error: ' + err.message) }
  }

  return (
    <div className="seccion">
      <h2>Ventas</h2>

      {puedeRegistrar && (
        <div className="card">
          <h3>Registrar nueva venta</h3>
          <div className="campo">
            <label>ID del cliente</label>
            <input value={idCliente} onChange={e => setIdCliente(e.target.value)} placeholder="ej. 1" />
          </div>
          <p style={{marginTop:'12px',fontWeight:500}}>Productos:</p>
          {items.map((item, i) => (
            <div key={i} className="item-fila">
              <div className="campo"><label>ID Producto</label>
                <input value={item.id_producto} onChange={e => cambiarItem(i,'id_producto',e.target.value)} /></div>
              <div className="campo"><label>Cantidad</label>
                <input value={item.cantidad} onChange={e => cambiarItem(i,'cantidad',e.target.value)} /></div>
            </div>
          ))}
          <div style={{marginTop:'10px',display:'flex',gap:'10px'}}>
            <button onClick={agregarItem} className="btn-cancel">+ Agregar producto</button>
            <button onClick={registrarVenta} className="btn-primary">Registrar venta</button>
          </div>
          {mensaje && <p className={mensaje.startsWith('Error') ? 'error-msg' : 'ok-msg'}>{mensaje}</p>}
        </div>
      )}

      <div className="card">
        <h3>Historial de ventas</h3>
        <div className="tabla-wrap"><table>
          <thead><tr>
            <th>ID</th><th>Fecha</th><th>Cliente</th><th>Empleado</th>
            <th>Total</th><th>Estado</th><th>Líneas</th>
            {puedeCancelar && <th>Acciones</th>}
          </tr></thead>
          <tbody>
            {lista.map(v => (
              <tr key={v.id_venta}>
                <td>{v.id_venta}</td>
                <td>{new Date(v.fecha).toLocaleDateString('es-GT')}</td>
                <td>{v.cliente}</td><td>{v.empleado}</td>
                <td>Q{v.total}</td><td>{v.estado}</td><td>{v.cantidad_lineas}</td>
                {puedeCancelar && (
                  <td>
                    {v.estado !== 'CANCELADA' &&
                      <button onClick={() => cancelarVenta(v.id_venta)} className="btn-del">Cancelar</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}

// ---- STOCK (solo admin y bodega) ----
function Stock({ usuario }) {
  const [form, setForm] = useState({ id_producto:'', cantidad:'', tipo:'ENTRADA', motivo:'' })
  const [mensaje, setMensaje] = useState('')

  function handleChange(e) { setForm({...form,[e.target.name]:e.target.value}) }

  async function handleSubmit(e) {
    e.preventDefault(); setMensaje('')
    try {
      const res = await llamar('/stock/ajustar', {
        method:'POST',
        body: JSON.stringify({ ...form, id_empleado: usuario.id_empleado })
      })
      setMensaje('Stock ajustado. Stock nuevo: ' + res.stock_nuevo)
      setForm({ id_producto:'', cantidad:'', tipo:'ENTRADA', motivo:'' })
    } catch (err) { setMensaje('Error: ' + err.message) }
  }

  return (
    <div className="seccion">
      <h2>Gestión de Stock</h2>
      <div className="card">
        <h3>Ajustar stock de producto</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="campo"><label>ID Producto</label>
            <input name="id_producto" value={form.id_producto} onChange={handleChange} /></div>
          <div className="campo"><label>Cantidad</label>
            <input name="cantidad" value={form.cantidad} onChange={handleChange} /></div>
          <div className="campo"><label>Tipo</label>
            <select name="tipo" value={form.tipo} onChange={handleChange}>
              <option value="ENTRADA">ENTRADA</option>
              <option value="SALIDA">SALIDA</option>
              <option value="AJUSTE">AJUSTE</option>
            </select></div>
          <div className="campo"><label>Motivo</label>
            <input name="motivo" value={form.motivo} onChange={handleChange} /></div>
          <button type="submit" className="btn-primary">Aplicar ajuste</button>
        </form>
        {mensaje && <p className={mensaje.startsWith('Error') ? 'error-msg' : 'ok-msg'}>{mensaje}</p>}
      </div>
    </div>
  )
}

// ---- REPORTES ----
function Reportes({ usuario }) {
  const [tipoReporte, setTipoReporte] = useState('join1')
  const [datos, setDatos] = useState([])
  const [mensaje, setMensaje] = useState('')

  const opciones = [
    { val:'join1',     label:'Productos con categoría y proveedor (JOIN)' },
    { val:'join2',     label:'Ventas con cliente y empleado (JOIN)' },
    { val:'join3',     label:'Detalle de ventas con productos (JOIN)' },
    { val:'subquery1', label:'Productos sobre el precio promedio (Subquery)' },
    { val:'subquery2', label:'Clientes con compras mayores a Q250 (Subquery IN)' },
    { val:'group',     label:'Ventas por categoría (GROUP BY / HAVING)' },
    { val:'cte',       label:'Clientes con más de Q150 en compras (CTE)' },
    { val:'view',      label:'Resumen de ventas (VIEW)' }
  ]

  useEffect(() => { cargarReporte(tipoReporte) }, [tipoReporte])

  function cargarReporte(tipo) {
    setMensaje(''); setDatos([])
    llamar('/reportes/' + tipo).then(setDatos).catch(e => setMensaje(e.message))
  }

  function renderTabla() {
    if (datos.length === 0) return <p>Sin datos para mostrar.</p>
    const cols = Object.keys(datos[0])
    return (
      <table>
        <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {datos.map((fila, i) => (
            <tr key={i}>{cols.map(c => <td key={c}>{String(fila[c] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="seccion">
      <h2>Reportes SQL</h2>
      <div className="card">
        <div className="campo">
          <label>Seleccionar reporte</label>
          <select value={tipoReporte} onChange={e => setTipoReporte(e.target.value)}>
            {opciones.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
        </div>
        <div style={{marginTop:'10px'}}>
          <a href={`${BASE}/reportes/${tipoReporte}/csv`} className="btn-export">Exportar CSV</a>
        </div>
        {mensaje && <p className="error-msg">{mensaje}</p>}
      </div>
      <div className="card"><div className="tabla-wrap">{renderTabla()}</div></div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)