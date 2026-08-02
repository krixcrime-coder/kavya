import * as Contacts from "expo-contacts";

export async function getContacts(): Promise<
  Array<{ id: string; name: string; phones: string[] }>
> {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== "granted") return [];

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
  });

  return data
    .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name || "Unknown",
      phones: c.phoneNumbers?.map((p) => p.number?.replace(/\D/g, "") || "") || [],
    }));
}

export async function findContactByName(
  query: string
): Promise<{ id: string; name: string; phones: string[] } | null> {
  const contacts = await getContacts();
  const normalized = query.toLowerCase();
  return (
    contacts.find((c) => c.name.toLowerCase().includes(normalized)) || null
  );
}
