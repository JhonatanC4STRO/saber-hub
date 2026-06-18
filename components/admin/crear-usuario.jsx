'use client';
import React from 'react';
import EliminarUsuario from './eliminar-usuario';

export default function CrearUsuario() {
  const [nombre, setNombre] = React.useState('');
  const [documento, setDocumento] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('/api/admin/crear-usuario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre,
        documento,
        email,
        password,
        role,
      }),
    });

    if (response.ok) {
      alert('Usuario creado exitosamente');
      setNombre('');
      setDocumento('');
      setEmail('');
      setPassword('');
      setRole('');
    } else {
      const errorData = await response.json();
      alert('Error: ' + (errorData.message || 'Error al crear el usuario'));
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="nombre">Nombre</label>
        <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <label htmlFor="documento">Documento</label>
        <input
          type="text"
          id="documento"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
        />
        <label htmlFor="email">Email</label>
        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label htmlFor="role">Rol</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Selecciona un rol</option>
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
          <option value="estudiante">Estudiante</option>
        </select>
        <button type="submit">Crear usuario</button>
      </form>
      <EliminarUsuario />
    </div>
  );
}
