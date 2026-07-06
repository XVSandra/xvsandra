type Invitado = {
  nombre: string;
  pases: number;
};

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function obtenerInvitado(codigo: string): Promise<Invitado | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/invitados/${codigo}?key=${apiKey}`;

  const response = await fetch(url);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error Firestore REST: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    nombre: data.fields?.nombre?.stringValue || "Invitado especial",
    pases: Number(
      data.fields?.pases?.integerValue ||
      data.fields?.pases?.doubleValue ||
      1
    ),
  };
}