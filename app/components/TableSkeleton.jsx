import Skeleton from "./Skeleton";

const widths = ["60%", "40%", "80%", "50%", "70%"];

export default function TableSkeleton({ columns = 5, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="py-3 px-4">
              <Skeleton width={widths[(i + j) % widths.length]} height="18px" />
              {j === 0 && <Skeleton width="30%" height="12px" style={{ marginTop: 6 }} />}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
