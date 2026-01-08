import React from "react";
import {
  FullscreenIcon,
  Clock6Icon,
  Calendar1Icon,
  MapPinIcon,
} from "lucide-react";

function EventDetails() {
  return (
    <div className="w-full min-h-screen flex flex-col p-3 bg-[#110019]">
      <div className="bg-[#21142c] p-1.5 pb-8 gap-8 flex flex-col rounded-3xl overflow-hidden">
        <div className="relative w-full">
          <img
            src="https://i0.wp.com/technode.com/wp-content/uploads/2023/04/BEYOND-2023-Banner.jpeg?fit=900%2C501&ssl=1"
            alt="event image"
            className="rounded-xl"
          />
          <div className="p-2 flex items-center justify-center bg-white absolute bottom-2 right-2 rounded-full">
            <FullscreenIcon className="w-5 h-5" />
          </div>
        </div>
        <div className="px-3">
          <h2 className="font-sans mb-2 font-bold text-[#ccb7d8]">AI-CON</h2>
          <p className="text-[#aa96b9]">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto ad
            dolore beatae.
          </p>
        </div>
      </div>
      <div className="w-full text-[#a792b9] flex flex-row items-center justify-between py-6 px-3 gap-3">
        <div className="flex flex-col items-center gap-2 justify-center">
          <Clock6Icon className="w-5 h-5" />
          <span>6:00 pm </span>
        </div>
        <div className="flex flex-col items-center gap-2 justify-center">
          <Calendar1Icon className="w-5 h-5" />
          <span>12 February 2026</span>
        </div>
        <div className="flex flex-col items-center gap-2 justify-center">
          <MapPinIcon className="w-5 h-5" />
          <span>AB2 201</span>
        </div>
      </div>
      <div class="bg-[#21142c] rounded-3xl text-[#a792b9] p-5">
        <header>
          <h1 className="text-xl font-bold mb-4" >Club</h1>
        </header>

        <div class="content flex flex-col gap-3 justify-center ">
          <div class="section">
            <h2 className="font-bold mb-2 text-xl" >Event Highlights</h2>
            <ul className="list-disc mx-7" >
              <li class="highlight-item">24 Hour Hackathon</li>
              <li class="highlight-item">Experienced Guests</li>
              <li class="highlight-item">Automation</li>
            </ul>
          </div>

          <div class="section">
            <h2 className="font-bold my-2 text-xl" >Coordinators</h2>
            <div class="coordinators-container">
              <div class="coordinator-card mx-7">
                <li class="coordinator-name">Dr. Ajeet Singh</li>
                <li class="coordinator-role">Faculty Coordinator</li>
              </div>
            </div>

            <h3 className="font-bold my-2 text-xl">Student Coordinators</h3>
            <div class="student-names mx-7">
              <li class="student-name">Student A</li>
              <li class="student-name">Student B</li>
            </div>
          </div>

          <div class="section">
            <h2 className="font-bold my-2 text-xl" >Registration Fee</h2>
            <div class="registration-fees">
              <div class="fee-card mx-7">
                <li>Per person ₹200</li>
                <li>Duo ₹180</li>
                <li>Trio ₹140</li>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
