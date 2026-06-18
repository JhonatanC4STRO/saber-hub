'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, CornerDownRight, Trash2, Reply, Clock, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function ComentariosLeccion({ leccionId, currentUser }) {
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create state
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [replyToId, setReplyToId] = useState(null); // ID of comment being replied to
  const [replyContent, setReplyContent] = useState('');

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isInstructorOrAdmin = currentUser?.rol === 'admin' || currentUser?.rol === 'instructor';

  const loadComentarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/lecciones/${leccionId}/comentarios`);
      if (res.ok) {
        const data = await res.json();
        setComentarios(data || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'No se pudieron cargar los comentarios.');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, [leccionId]);

  useEffect(() => {
    loadComentarios();
  }, [loadComentarios]);

  // Handle Create Root Comment
  const handleCrearComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || enviando) return;

    setEnviando(true);
    try {
      const res = await fetch(`/api/lecciones/${leccionId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: nuevoComentario.trim() })
      });

      if (res.ok) {
        const created = await res.json();
        setComentarios(prev => [...prev, created]);
        setNuevoComentario('');
        showToast('Pregunta publicada con éxito.');
      } else {
        showToast('Error al publicar comentario.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  // Handle Create Reply
  const handleCrearRespuesta = async (e, padreId) => {
    e.preventDefault();
    if (!replyContent.trim() || enviando) return;

    setEnviando(true);
    try {
      const res = await fetch(`/api/lecciones/${leccionId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: replyContent.trim(), padreId })
      });

      if (res.ok) {
        const created = await res.json();
        setComentarios(prev => [...prev, created]);
        setReplyContent('');
        setReplyToId(null);
        showToast('Respuesta enviada.');
      } else {
        showToast('Error al publicar respuesta.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  // Handle Delete Comment
  const handleEliminarComentario = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;

    try {
      const res = await fetch(`/api/comentarios/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setComentarios(prev => prev.filter(c => c.id !== id));
        showToast('Comentario eliminado.');
      } else {
        showToast('No tienes permisos para eliminar.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar.', 'error');
    }
  };

  // Build tree logic
  const rootComments = comentarios.filter(c => c.padreId === null);
  const getReplies = (padreId) => comentarios.filter(c => c.padreId === padreId);

  return (
    <div className="mt-12 pt-8 border-t border-gray-100 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[5000] flex items-center gap-2 border rounded-lg px-4 py-3 shadow-md transform transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-[13px] font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="text-[#1E40AF]" size={20} />
        <h3 className="font-bold text-[17px] text-[#111827] uppercase tracking-wide">Preguntas y Respuestas de la Clase</h3>
        <span className="bg-[#DBEAFE] text-[#1E40AF] font-bold text-[11px] px-2.5 py-0.5 rounded-full">
          {comentarios.length} {comentarios.length === 1 ? 'comentario' : 'comentarios'}
        </span>
      </div>

      {/* New Top Level Comment Form */}
      <form onSubmit={handleCrearComentario} className="mb-8 bg-gray-50 border border-gray-100 rounded-xl p-4">
        <div className="flex gap-3 items-start">
          {currentUser?.imagen ? (
            <img src={currentUser.imagen} alt="Tu perfil" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-9 h-9 bg-[#1E40AF] text-white rounded-full flex items-center justify-center font-bold text-[14px]">
              {currentUser?.nombre?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-grow">
            <textarea
              required
              rows={3}
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="¿Tienes alguna duda sobre este tema? Pregúntale a tu instructor..."
              className="w-full border border-gray-200 rounded-lg p-3 text-[13.5px] bg-white text-[#111827] placeholder-gray-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={enviando || !nuevoComentario.trim()}
                className="flex items-center gap-1.5 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
              >
                <Send size={13} />
                <span>Enviar pregunta</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Error or Empty views */}
      {error && (
        <div className="text-center py-6 text-red-500 font-medium text-[13px]">
          {error}
        </div>
      )}

      {loading && comentarios.length === 0 ? (
        <div className="text-center py-8 text-gray-400 font-medium text-[13px]">
          Cargando comentarios...
        </div>
      ) : rootComments.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6">
          <MessageSquare className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="font-bold text-[14px] text-slate-800">No hay preguntas todavía</p>
          <p className="text-[12px] text-gray-500 mt-1 font-normal">
            Sé el primero en formular una pregunta o iniciar una discusión para esta clase.
          </p>
        </div>
      ) : (
        /* Comments Feed */
        <div className="space-y-6">
          {rootComments.map((comment) => {
            const replies = getReplies(comment.id);
            const userRoleName = comment.usuario?.rol?.nombre || 'Estudiante';
            const isCommentInstructor = userRoleName === 'instructor' || userRoleName === 'admin';
            
            return (
              <div key={comment.id} className="border-b border-gray-50 pb-6 last:border-b-0">
                {/* Main Comment */}
                <div className="flex gap-3 items-start">
                  {comment.usuario?.imagen ? (
                    <img src={comment.usuario.imagen} alt={comment.usuario.nombre} className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center font-bold text-[14px] flex-shrink-0">
                      {comment.usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[13.5px] text-[#111827]">{comment.usuario?.nombre || 'Usuario'}</span>
                      
                      {isCommentInstructor && (
                        <span className="bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] font-bold text-[9.5px] px-1.5 py-0.5 rounded uppercase tracking-wide">
                          Instructor
                        </span>
                      )}

                      <span className="text-gray-300 text-[10px]">•</span>
                      <span className="text-gray-400 text-[11px] flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(comment.creado).toLocaleDateString('es-CO', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-[13.5px] text-[#374151] font-normal leading-relaxed mt-1.5 whitespace-pre-wrap">
                      {comment.contenido}
                    </p>

                    {/* Actions bar */}
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => {
                          setReplyToId(replyToId === comment.id ? null : comment.id);
                          setReplyContent('');
                        }}
                        className="text-[12px] font-bold text-[#1E40AF] hover:underline flex items-center gap-1"
                      >
                        <Reply size={12} />
                        <span>Responder</span>
                      </button>

                      {(currentUser?.id === comment.usuarioId || isInstructorOrAdmin) && (
                        <button
                          onClick={() => handleEliminarComentario(comment.id)}
                          className="text-[12px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"
                        >
                          <Trash2 size={12} />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>

                    {/* Reply Input Form (inline) */}
                    {replyToId === comment.id && (
                      <form onSubmit={(e) => handleCrearRespuesta(e, comment.id)} className="mt-3 bg-gray-50 border border-gray-100 rounded-lg p-3 flex gap-2 items-center">
                        <input
                          required
                          type="text"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Escribe una respuesta para esta pregunta..."
                          className="flex-grow h-9 border border-gray-200 rounded-md px-3 text-[13px] bg-white text-[#111827] focus:outline-none focus:border-[#1E40AF]"
                        />
                        <button
                          type="submit"
                          disabled={enviando || !replyContent.trim()}
                          className="h-9 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-4 rounded-md text-[12.5px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          <span>Responder</span>
                        </button>
                      </form>
                    )}

                    {/* Replies Cascading */}
                    {replies.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-100 space-y-4">
                        {replies.map((reply) => {
                          const replyRoleName = reply.usuario?.rol?.nombre || 'Estudiante';
                          const isReplyInstructor = replyRoleName === 'instructor' || replyRoleName === 'admin';

                          return (
                            <div key={reply.id} className="flex gap-2.5 items-start">
                              <CornerDownRight size={14} className="text-gray-300 mt-2 flex-shrink-0" />
                              
                              {reply.usuario?.imagen ? (
                                <img src={reply.usuario.imagen} alt={reply.usuario.nombre} className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center font-bold text-[12px] flex-shrink-0">
                                  {reply.usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}

                              <div className="flex-grow min-w-0 bg-gray-50/50 hover:bg-gray-50 border border-gray-100/30 rounded-lg p-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-[12.5px] text-[#111827]">{reply.usuario?.nombre || 'Usuario'}</span>
                                  
                                  {isReplyInstructor && (
                                    <span className="bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] font-bold text-[8.5px] px-1 py-0.2 rounded uppercase tracking-wide">
                                      Instructor
                                    </span>
                                  )}

                                  <span className="text-gray-300 text-[10px]">•</span>
                                  <span className="text-gray-400 text-[10.5px] flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(reply.creado).toLocaleDateString('es-CO', {
                                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>

                                  {(currentUser?.id === reply.usuarioId || isInstructorOrAdmin) && (
                                    <button
                                      onClick={() => handleEliminarComentario(reply.id)}
                                      className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5 ml-auto cursor-pointer"
                                      title="Eliminar respuesta"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>

                                <p className="text-[13px] text-[#374151] font-normal leading-relaxed mt-1 whitespace-pre-wrap">
                                  {reply.contenido}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
