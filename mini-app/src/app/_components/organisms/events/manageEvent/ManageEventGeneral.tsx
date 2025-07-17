import ManageEventDate from "./generalInfo/ManageEventDate";
import ManageEventGeneralInfo from "./generalInfo/ManageEventGeneralInfo";
import ManageEventLocation from "./generalInfo/ManageEventLocation";

const ManageEventGeneral = () => {
  return (
    <div className="flex flex-col gap-4">
      <ManageEventGeneralInfo />
      <ManageEventDate />
      <ManageEventLocation />
    </div>
  );
};

export default ManageEventGeneral;
