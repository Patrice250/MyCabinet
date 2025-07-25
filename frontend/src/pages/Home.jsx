import React from "react";
import BriefcaseStatus from "../components/BriefcaseStatus";
import AccessCharts from "../components/Chart";  // Fixed import path

function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <BriefcaseStatus />
      <AccessCharts />
    </div>
  );
}

export default Dashboard;