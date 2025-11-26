"use client";

import { useEffect, useState } from "react";
import axios from "../../../lib/bootstrap";
import { useSearchParams, useRouter } from "next/navigation";

export default function SalesShow() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");

    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        axios.get(`/sales/${id}`)
            .then((res) => {
                setSale(res.data);
                setLoading(false);
            })
            .catch(() => {
                alert("Failed to load sale");
                router.push("/frontend/sales/index");
            });
    }, [id]);

    if (loading || !sale) {
        return <div className="container py-4">Loading...</div>;
    }

    const diamond = sale.diamond || {};
    const client = sale.client || {};
    const broker = sale.broker || {};

    return (
        <div className="container py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2>Sale Details</h2>
                </div>
                <div className="col text-end">
                    <a
                        href={`/frontend/sales/edit?id=${sale.id}`}
                        className="btn btn-warning me-2"
                    >
                        Edit Sale
                    </a>
                    <a href="/frontend/sales/index" className="btn btn-secondary">
                        Back to List
                    </a>
                </div>
            </div>

            <div className="row">
                {/* Diamond Information */}
                <div className="col-md-6 mb-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Diamond Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <table className="table table-bordered">
                                        <tbody>
                                            <tr>
                                                <th>Certificate #</th>
                                                <td>{diamond.certificate_number}</td>
                                            </tr>
                                            <tr>
                                                <th>Stone Type</th>
                                                <td>{diamond.stone_type}</td>
                                            </tr>
                                            <tr>
                                                <th>Shape</th>
                                                <td>{diamond.shape}</td>
                                            </tr>
                                            <tr>
                                                <th>Weight</th>
                                                <td>{Number(diamond.weight).toFixed(2)} carats</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="col-md-6">
                                    <table className="table table-bordered">
                                        <tbody>
                                            <tr>
                                                <th>Color</th>
                                                <td>{diamond.color}</td>
                                            </tr>
                                            <tr>
                                                <th>Clarity</th>
                                                <td>{diamond.clarity}</td>
                                            </tr>
                                            <tr>
                                                <th>Cut</th>
                                                <td>{diamond.cut}</td>
                                            </tr>
                                            <tr>
                                                <th>Polish</th>
                                                <td>{diamond.pol}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Information */}
                <div className="col-md-6 mb-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Client Information</h5>
                        </div>
                        <div className="card-body">
                            <table className="table table-bordered">
                                <tbody>
                                    <tr>
                                        <th>Company Name</th>
                                        <td>{client.company_name}</td>
                                    </tr>
                                    <tr>
                                        <th>Contact Name</th>
                                        <td>{client.contact_name}</td>
                                    </tr>
                                    <tr>
                                        <th>Email</th>
                                        <td>{client.email}</td>
                                    </tr>
                                    <tr>
                                        <th>Phone</th>
                                        <td>{client.phone || "-"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Broker Information */}
                {sale.broker && (
                    <div className="col-md-6 mb-4">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Broker Information</h5>
                            </div>
                            <div className="card-body">
                                <table className="table table-bordered">
                                    <tbody>
                                        <tr>
                                            <th>Name</th>
                                            <td>{broker.name}</td>
                                        </tr>
                                        <tr>
                                            <th>Company</th>
                                            <td>{broker.company_name}</td>
                                        </tr>
                                        <tr>
                                            <th>Email</th>
                                            <td>{broker.email}</td>
                                        </tr>
                                        <tr>
                                            <th>Phone</th>
                                            <td>{broker.phone || "-"}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sale Details */}
                <div className="col-md-6 mb-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Sale Details</h5>
                        </div>
                        <div className="card-body">
                            <table className="table table-bordered">
                                <tbody>
                                    <tr>
                                        <th>Sale Date</th>
                                        <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                                    </tr>
                                    <tr>
                                        <th>Sale Amount (USD)</th>
                                        <td>${Number(sale.sale_amount).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <th>RAP Discount</th>
                                        <td>{sale.sale_rap_discount}%</td>
                                    </tr>

                                    {sale.conversion_rate && (
                                        <tr>
                                            <th>Conversion Rate</th>
                                            <td>{sale.conversion_rate}</td>
                                        </tr>
                                    )}

                                    {sale.sale_amount_inr && (
                                        <tr>
                                            <th>Sale Amount (INR)</th>
                                            <td>₹{Number(sale.sale_amount_inr).toFixed(2)}</td>
                                        </tr>
                                    )}

                                    {sale.brokerage_rate && (
                                        <tr>
                                            <th>Brokerage Rate</th>
                                            <td>{sale.brokerage_rate}%</td>
                                        </tr>
                                    )}

                                    {sale.brokerage_amount && (
                                        <tr>
                                            <th>Brokerage Amount</th>
                                            <td>${Number(sale.brokerage_amount).toFixed(2)}</td>
                                        </tr>
                                    )}

                                    <tr>
                                        <th>Status</th>
                                        <td>
                                            <span
                                                className={`badge bg-${
                                                    sale.status === "completed"
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
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {sale.notes && (
                    <div className="col-md-12 mb-4">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Notes</h5>
                            </div>
                            <div className="card-body">
                                <p>{sale.notes}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
