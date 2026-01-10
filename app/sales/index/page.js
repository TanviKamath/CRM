"use client";

import { useEffect, useState } from "react";
import axios from "../../lib/bootstrap";
import { useRouter } from "next/navigation";

export default function SalesIndex() {
    const router = useRouter();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState("");

    // Fetch sales
    useEffect(() => {
        axios.get("/sales")
            .then((res) => {
                setSales(res.data.data || res.data); // supports pagination or raw array
                setLoading(false);
            })
            .catch(() => {
                alert("Failed to fetch sales");
                setLoading(false);
            });
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this sale?")) return;

        await axios.get("/sanctum/csrf-cookie");
        await axios.delete(`/sales/${id}`);

        setSales(sales.filter((s) => s.id !== id));
        setSuccess("Sale deleted successfully.");
    };

    if (loading) {
        return <div className="container py-4">Loading...</div>;
    }

    return (
        <div className="container py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2>Sales</h2>
                </div>
                <div className="col text-end">
                    <a href="/frontend/sales/create" className="btn btn-primary">
                        Create New Sale
                    </a>
                </div>
            </div>

            {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {success}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setSuccess("")}
                    ></button>
                </div>
            )}

            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Diamond</th>
                                    <th>Client</th>
                                    <th>Date</th>
                                    <th>Amount (USD)</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sales.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center">
                                            No sales found.
                                        </td>
                                    </tr>
                                ) : (
                                    sales.map((sale) => (
                                        <tr key={sale.id}>
                                            <td>{sale.id}</td>
                                            <td>{sale.diamond?.certificate_number}</td>
                                            <td>{sale.client?.company_name}</td>
                                            <td>{sale.created_at?.substring(0, 10)}</td>
                                            <td>${Number(sale.sale_amount).toFixed(2)}</td>
                                            <td>
                                                <span
                                                    className={`badge bg-${sale.status === "completed"
                                                        ? "success"
                                                        : sale.status === "pending"
                                                            ? "warning"
                                                            : "danger"
                                                        }`}
                                                >
                                                    {sale.status.charAt(0).toUpperCase() +
                                                        sale.status.slice(1)}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="btn-group" role="group">
                                                    <a
                                                        href={`/frontend/sales/show?id=${sale.id}`}
                                                        className="btn btn-sm btn-info"
                                                    >
                                                        View
                                                    </a>

                                                    <a
                                                        href={`/frontend/sales/edit?id=${sale.id}`}
                                                        className="btn btn-sm btn-warning"
                                                    >
                                                        Edit
                                                    </a>

                                                    <button
                                                        onClick={() => handleDelete(sale.id)}
                                                        className="btn btn-sm btn-danger"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* pagination optional */}
                </div>
            </div>
        </div>
    );
}
