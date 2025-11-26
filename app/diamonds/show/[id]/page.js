// app/diamonds/show/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShowDiamond({ params }) {
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
      <h2>Diamond #{diamond.id}</h2>

      <dl className="row">
        <dt className="col-sm-3">Certificate</dt><dd className="col-sm-9">{diamond.certificate_number}</dd>
        <dt className="col-sm-3">Shape</dt><dd className="col-sm-9">{diamond.shape}</dd>
        <dt className="col-sm-3">Weight</dt><dd className="col-sm-9">{diamond.weight}</dd>
        <dt className="col-sm-3">Color</dt><dd className="col-sm-9">{diamond.color}</dd>
        <dt className="col-sm-3">Clarity</dt><dd className="col-sm-9">{diamond.clarity}</dd>
        <dt className="col-sm-3">Cut</dt><dd className="col-sm-9">{diamond.cut}</dd>
        <dt className="col-sm-3">Availability</dt><dd className="col-sm-9">{diamond.availability}</dd>
      </dl>

      <Link href={`/diamonds/edit/${diamond.id}`} className="btn btn-warning me-2">Edit</Link>
      <Link href="/diamonds" className="btn btn-secondary">Back</Link>
    </div>
  );
}
