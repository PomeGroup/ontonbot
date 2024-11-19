import React from "react";
import { EventDateManager } from "./EventDateManager";
import EventLocationManager from "./EventLocationInputs";

const TimePlaceForm = () => {
  return (
    <>
      <EventDateManager />
      <EventLocationManager />
    </>
  );
};

export default TimePlaceForm;
