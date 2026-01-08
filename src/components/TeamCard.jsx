import React from 'react'

function TeamCard({name,imgurl,designation}) {
  return (
    <div className='flex flex-col p-1.5 rounded-lg w-35 bg-[#21142c] ' >
        <img className='rounded-lg aspect-square w-full mb-3'  src={imgurl} alt="member_image" />
        <span className='text-[#ccb7b8] font-medium' >{name}</span>
        <span className='text-[#5e5c71]' >{designation}</span>
    </div>
  )
}

export default TeamCard;