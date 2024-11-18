"use client";

import Link from "next/link";
import { useState } from "react";
import ArrowDownIcon from "../icon/ArrowDownIcom";
import EarthIcon from "../icon/EarthIcon";

export default function LanguageSelect() {

   const [showMenu, setShowMenu] = useState(false);

   return (
      <div className="relative">
         <button className="flex items-center gap-2 px-4" type="button" onClick={() => setShowMenu(!showMenu)}>
            <EarthIcon />

            <strong className="block text-[17px]">EN</strong>

            <ArrowDownIcon />
         </button>

         <div className={`absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 ${showMenu ? '' : 'hidden'}`}>
            <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownDefaultButton">
               <li>
                  <Link href="#" className="block px-4 py-2 hover:bg-gray-100">EN</Link>
               </li>
            </ul>
         </div>
      </div>
   )
}
