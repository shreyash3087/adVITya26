import React from "react";
import TeamCard from "../components/TeamCard";

function Team() {
  const Data = [
    {
      name: "Dr. G. Viswanathan",
      designation: "Chancellor",
      imgurl:
        "https://vitonline.in/wp-content/uploads/2025/02/chacellor-e1738818533699.webp",
    },
    {
      name: "Dr. Sankar Viswanathan",
      designation: "Vice President",
      imgurl:
        "https://vitonline.in/wp-content/uploads/2025/02/chacellor-e1738818533699.webp",
    },
    {
      name: "Ms. Kadhambari S. Viswanathan",
      designation: "Assistant Vice President",
      imgurl:
        "https://vitonline.in/wp-content/uploads/2025/02/chacellor-e1738818533699.webp",
    },
    {
      name: "Dr. Sekar Viswanathan",
      designation: "Pro-Vice Chancellor",
      imgurl:
        "https://vitonline.in/wp-content/uploads/2025/02/chacellor-e1738818533699.webp",
    },
    {
      name: "Mr. V. Raju",
      designation: "Registrar",
      imgurl:
        "https://vitonline.in/wp-content/uploads/2025/02/chacellor-e1738818533699.webp",
    },
    {
      name: "Dr. P. Gunasekaran",
      designation: "Convener",
      imgurl:
        "https://vitonline.in/wp-content/uploads/2025/02/chacellor-e1738818533699.webp",
    },
  ];
  return (
    <div className="min-h-screen text-[#816e8b] team-main-div gap-4 box-border flex flex-col w-screen bg-[#110019]">
      <h1 className="font-sans text-3xl font-extrabold">OUR TEAM</h1>
      <p>
        Dive into the heart of VIT Bhopal with AdVITYa'25 – an electrifying
        blend of technology and culture. Crafted by the ingenious minds of VIT
        Bhopal students,
      </p>
      <div className="flex flex-col mt-6">
        <span className="font-sans font-extrabold text-xl mb-3" >Our Patron</span>
        <div className="flex flex-row items-center flex-wrap gap-7" >
          {Data.map((element) => {
            return (
              <TeamCard
                name={element.name}
                designation={element.designation}
                imgurl={element.imgurl}
              />
            );
          })}
        </div>
      </div>
      {/* Section 2 */}
      <div className="flex flex-col mt-6">
        <span className="font-sans font-extrabold text-xl mb-3" >Conveyors</span>
        <div className="flex flex-row items-center flex-wrap gap-7" >
          {Data.map((element) => {
            return (
              <TeamCard
                name={element.name}
                designation={element.designation}
                imgurl={element.imgurl}
              />
            );
          })}
        </div>
      </div>
      {/* Section 3 */}
      <div className="flex flex-col mt-6">
        <span className="font-sans font-extrabold text-xl mb-3" >Student Council</span>
        <div className="flex flex-row items-center flex-wrap gap-7" >
          {Data.map((element) => {
            return (
              <TeamCard
                name={element.name}
                designation={element.designation}
                imgurl={element.imgurl}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Team;
