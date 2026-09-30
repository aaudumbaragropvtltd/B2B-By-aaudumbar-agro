import { permanentRedirect } from 'next/navigation';

export default async function SupplierRedirectPage({ params }) {
  const { id } = await params;
  permanentRedirect(`/directory/supplier/${id}`);
}
