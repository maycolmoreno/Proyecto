import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatbotApi } from '../api/chatbot.api.js';

const CONVERSACION_ID_KEY = 'donaconnect_chatbot_conversacion_id';

// Hook puro (CU-009/RF-014) — un documento de conversación por usuario en el backend (no por
// sesión): `sesionId` se genera una vez por pestaña del navegador y se envía en cada mensaje solo
// para que el backend agrupe sesiones dentro de esa única conversación. `conversacionId` se
// persiste en sessionStorage para restaurar el historial al navegar entre ChatWidget y /chatbot.
export function useChatbot() {
  const queryClient = useQueryClient();
  const [conversacionId, setConversacionId] = useState<string | null>(() =>
    sessionStorage.getItem(CONVERSACION_ID_KEY),
  );
  const sesionIdRef = useRef<string>(crypto.randomUUID());

  const conversacion = useQuery({
    queryKey: ['chatbot', 'conversacion', conversacionId],
    queryFn: () => chatbotApi.obtenerConversacion(conversacionId!),
    enabled: Boolean(conversacionId),
  });

  const enviar = useMutation({
    mutationFn: (texto: string) => chatbotApi.enviarMensaje({ texto, sesionId: sesionIdRef.current }),
    onSuccess: (resultado) => {
      sessionStorage.setItem(CONVERSACION_ID_KEY, resultado.conversacionId);
      setConversacionId(resultado.conversacionId);
      queryClient.invalidateQueries({ queryKey: ['chatbot', 'conversacion', resultado.conversacionId] });
    },
  });

  return {
    mensajes: conversacion.data?.mensajes ?? [],
    cargandoHistorial: conversacion.isLoading,
    enviar: (texto: string) => enviar.mutateAsync(texto),
    enviando: enviar.isPending,
  };
}
