'use client';
import { useState, useEffect, useCallback } from 'react';

export default function EliminarUsuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    email: '',
    documento: '',
    role: '',
    activo: true,
    password: '',
  });

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/usuarios');
      if (!res.ok) throw new Error('Error al cargar usuarios');
      const data = await res.json();
      setUsuarios(data.usuarios);
    } catch {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Desactivar al usuario "${nombre}"?`)) return;

    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert('Error: ' + data.message);
        return;
      }
      alert(data.message);
      fetchUsuarios();
    } catch {
      alert('Error al desactivar el usuario');
    }
  };

  const handleEditarClick = (u) => {
    setUsuarioEditando(u);
    setEditForm({
      nombre: u.nombre,
      email: u.email,
      documento: u.documento,
      role: u.rol?.nombre || '',
      activo: u.activo,
      password: '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/usuarios/${usuarioEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Error: ' + data.message);
        return;
      }
      alert(data.message);
      setUsuarioEditando(null);
      fetchUsuarios();
    } catch {
      alert('Error al actualizar el usuario');
    }
  };

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>{usuarioEditando ? 'Editar Usuario' : 'Gestión de Usuarios'}</h2>

      {usuarioEditando ? (
        <div
          style={{
            marginTop: '20px',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '8px',
          }}
        >
          <form onSubmit={handleUpdate}>
            <div style={{ marginBottom: '10px' }}>
              <label>Nombre: </label>
              <br />
              <input
                style={{ width: '100%', padding: '8px' }}
                type="text"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Documento: </label>
              <br />
              <input
                style={{ width: '100%', padding: '8px' }}
                type="text"
                value={editForm.documento}
                onChange={(e) => setEditForm({ ...editForm, documento: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Email: </label>
              <br />
              <input
                style={{ width: '100%', padding: '8px' }}
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Rol: </label>
              <br />
              <select
                style={{ width: '100%', padding: '8px' }}
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                required
              >
                <option value="">Selecciona</option>
                <option value="admin">Admin</option>
                <option value="instructor">Instructor</option>
                <option value="estudiante">Estudiante</option>
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Estado: </label>
              <br />
              <select
                style={{ width: '100%', padding: '8px' }}
                value={editForm.activo ? 'true' : 'false'}
                onChange={(e) => setEditForm({ ...editForm, activo: e.target.value === 'true' })}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Nueva Contraseña (dejar en blanco para no cambiar): </label>
              <br />
              <input
                style={{ width: '100%', padding: '8px' }}
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
            </div>
            <div style={{ marginTop: '20px' }}>
              <button
                type="submit"
                style={{
                  marginRight: '10px',
                  padding: '8px 16px',
                  background: 'blue',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Actualizar
              </button>
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                style={{
                  padding: '8px 16px',
                  background: 'gray',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {usuarios.length === 0 ? (
            <p>No hay usuarios registrados.</p>
          ) : (
            <table
              border="1"
              cellPadding="8"
              style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}
            >
              <thead>
                <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Documento</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>{u.documento}</td>
                    <td>{u.rol?.nombre}</td>
                    <td>{u.activo ? 'Activo' : 'Inactivo'}</td>
                    <td>
                      <button
                        onClick={() => handleEditarClick(u)}
                        style={{ marginRight: '10px', cursor: 'pointer', padding: '4px 8px' }}
                      >
                        Editar
                      </button>{' '}
                      <button
                        onClick={() => handleEliminar(u.id, u.nombre)}
                        style={{
                          cursor: 'pointer',
                          padding: '4px 8px',
                          background: u.activo ? 'red' : 'gray',
                          color: 'white',
                          border: 'none',
                        }}
                        disabled={!u.activo}
                      >
                        {u.activo ? 'Desactivar' : 'Desactivado'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
