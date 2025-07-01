import ManageEventDate from "./generalInfo/ManageEventDate";
import ManageEventGeneralInfo from "./generalInfo/ManageEventGeneralInfo";

const ManageEventGeneral = () => {
  return (
    <div className="flex flex-col gap-4">
      <ManageEventGeneralInfo />
      <ManageEventDate />
    </div>
  );
};

export default ManageEventGeneral;
