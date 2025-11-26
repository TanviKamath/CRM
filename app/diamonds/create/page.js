// app/diamonds/create/page.js
import DiamondsForm from "../DiamondsForm";

export default function CreateDiamond() {
  return (
    <div className="container py-4">
      <h2>Add Diamond</h2>
      <DiamondsForm />
    </div>
  );
}
