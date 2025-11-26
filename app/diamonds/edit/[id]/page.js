// app/diamonds/edit/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import DiamondsForm from "../../DiamondsForm";

export default function EditDiamond({ params }) {
  const { id } = params;
  const [diamond, setDiamond] = useState(null);

  useEffect(() => {
    fetch(`/api/diamonds/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setDiamond);
  }, [id]);

  if (!diamond) return <p>Loading...</p>;

  return (
    <div className="container py-4">
      <h2>Edit Diamond</h2>
      <DiamondsForm initial={diamond} />
    </div>
  );
}
