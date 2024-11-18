"use client";

import { useState } from "react";

const GatewayAgenda = () => {
  const [isOpen1Nov, setIsOpen1Nov] = useState(false);
  const [isOpen2Nov, setIsOpen2Nov] = useState(false);

  const toggle1Nov = () => setIsOpen1Nov(!isOpen1Nov);
  const toggle2Nov = () => setIsOpen2Nov(!isOpen2Nov);

  const agenda1Nov = [
    { time: "08:30", title: "Registration and exploring the exhibition area", description: "Main Gateway Building" },
    { time: "10:15", title: "Opening of the Gateway", description: "Jack Booth, Co-Founder, TON Society" },
    { time: "10:30", title: "TON’s Multi-Directional Future", description: "Steve Yun, President, TON Foundation" },
    { time: "10:45", title: "TON x Telegram", description: "Andrew Rogozov, CEO, TOP" },
    { time: "11:05", title: "Quantum Leap of the Ecosystem", description: "Anthony Tsivarev, Director of EcoDev, TON Foundation" },
    { time: "11:20", title: "TON Core: Сhallenges on the road to 500M users", description: "Kirill Emelyanenko, TON Core" },
    { time: "11:35", title: "Panel: Path to Decentralization", description: "TON Society, TON Foundation, TON Studio, TON Core" },
    { time: "12:10", title: "How TON GameFi is Changing the Game", description: "Inal Kardan, TON Ventures, Partner" },
    { time: "12:20", title: "Notcoin & Beyond", description: "Sasha Plotvinov, CEO, Open builders" },
    { time: "12:30", title: "Panel: Present and Future of Tap-to-Earn", description: "Dogs, Yescoin, Blum, Gamee" },
    { time: "12:50", title: "Catizen: Why TON Games are the Future of GameFi", description: "Tim Wong, Chairman of Catizen Foundation" },
    { time: "13:00", title: "Gaming on TON", description: "Yat Siu, Co-Founder & Chairman, Animoca Brands" },
    { time: "13:10", title: "USDt on TON", description: "Alessandro Giori, Senior strategic partnership manager, Tether" },
    { time: "13:20", title: "Gasless payments on TON", description: "Oleg Andreev, CEO, Ton Apps" },
    { time: "13:30", title: "Stablecoin adoption on TON", description: "Victor Mendes, Director of BD, TOP" },
    { time: "13:40", title: "How Visa is building a bridge between TON and buying a doughnut", description: "Nikola Plecas, Senior Director, Global Head of GTM & Product Commercialization, Visa Crypto & Egor Avetisov, CBDO, Co-Founder Holders" },
    { time: "14:00", title: "Lunch break", description: "Networking area" },
    { time: "15:00", title: "Overview of DeFi on TON in 2024", description: "Vlad Degen, DeFi Lead, TON Foundation" },
    { time: "15:20", title: "DeDust keynote", description: "Nick, CEO, DeDust" },
    { time: "15:30", title: "LayerZero x TON", description: "Alex Chiocchi, Head of Product, LayerZero Labs" },
    { time: "15:40", title: "RFQ & DEX aggregation", description: "Martin Masser, CBDO, STON.fi" },
    { time: "15:50", title: "Panel: DeFi on TON", description: "Evaa, LayerZero, DeDust, StonFi, Tonstakers, Bemo" },
    { time: "16:10", title: "BTC on TON: Vision and Future", description: "Roman Krutovoy, Infrastructure Lead, TON Foundation" },
    { time: "16:20", title: "TON Teleport BTC", description: "Roman Nguyen, Chief Technical Officer, RSquad Blockchain Lab" },
    { time: "16:30", title: "Panel: BTC in Telegram", description: "BTC Teleport, FBTC, Stacks, HexTrust" },
    { time: "16:50", title: "TON: Innovation drivers in 2025", description: "Ian Wittkopp, TON Ventures, Partner" },
    { time: "17:00", title: "TON: A Thesis for The Community-Integrated Blockchain", description: "Mason Nystrom, Partner, Pantera Capital" },
    { time: "17:10", title: "Perspective sectors on TON for VC and Exchanges", description: "Binance Labs, Kenetic Capital, Pantera Capital, TON Ventures, KuCoin, Bitget" },
    { time: "17:30", title: "TON memecoins: the next big thing in crypto?", description: "Alena Shmalko, Ecosystem Lead, TON Foundation" },
    { time: "17:40", title: "Panel: TONs of memes: how do memecoins help TON blockchain grow?" },
    { time: "18:00", title: "Сlosing of the Day 1" }
  ];

  const agenda2Nov = [
    { time: "09:00", title: "Networking and exploring the exhibition area", description: "Main Gateway Building" },
    { time: "11:00", title: "TON Stablecoin Opportunity", description: "Toe Bautista, Research Analyst, GSR" },
    { time: "11:10", title: "Phygital use cases for Web3 builders", description: "Alyona Kuchynska, Head of Communications and Networking, Daos Hub" },
    { time: "11:20", title: "Embracing the Imminent Web3 Application Era: Why & How", description: "Veronica Wong, CEO & Co-founder, SafePal" },
    { time: "11:30", title: "Collaborative Growth in the TON Ecosystem", description: "Alessia Baumgartner, Business Partner-Ecosystems, DWF Labs" },
    { time: "11:40", title: "Tonscan.com: lessons learned from 1.5 years building on TON", description: "Gunnar Aastrand Grimnes, CTO, Tonscan.com" },
    { time: "11:50", title: "Blum: Decentralized Crypto App in Telegram", description: "Vlad Smerkis, Co-founder & CMO, Blum" },
    { time: "12:00", title: "App Ratings and Promotion: Community-Driven Catalog", description: "Oleg Illarionov & Vladimir Makhov, founders, TON App" },
    { time: "12:07", title: "TON Diamonds: How an artist launches a successful project on TON", description: "Pokras Lampas" },
    { time: "12:12", title: "How TON blockchain helps unite hearts", description: "Vladimir Makhov, founder, TON Dating" },
    { time: "12:15", title: "TONX: SuperApp Platform Layer Empowering a 950M-User Ecosystem", description: "Wego C, Co-Founder, TONX" },
    { time: "12:25", title: "Axelar: Onboard any asset and application to TON", description: "Georgios Vlachos, Co-founder of Axelar Network and Director of Axelar Foundation" },
    { time: "12:35", title: "Raffle for the Gateway attendees from sponsors" },
    { time: "12:45", title: "TON Tech Roadmap 2025", description: "Alex Melman, TON Core" },
    { time: "12:55", title: "New tools for developers", description: "Andrey Pfau, TON Core" },
    { time: "13:05", title: "Talk about FunC. Or not FunC?", description: "Aleksandr Kirsanov, TON Core" },
    { time: "13:25", title: "Tact & Dev Tools", description: "Anton Trunov, Compiler & Smart Contracts Lead, TON Studio" },
    { time: "13:35", title: "Webhooks by TON API", description: "Oleg Illarionov, CTO Tonkeeper" },
    { time: "13:45", title: "dTON: From Blockchain WTF to Asset OMG", description: "Andrey Tvorozhkov, Сo-founder, dTON" },
    { time: "14:00", title: "Lunch break", description: "Networking zone" },
    { time: "15:15", title: "Telegram Mini Apps Achievements and 2025 Plans", description: "Gleb Vorontsov, Head of Telegram Mini Apps, TON Studio" },
    { time: "15:25", title: "Gatto: How to build GameFi on Telegram Mini Apps", description: "Mariia Foikht, Community manager, PlayT" },
    { time: "15:35", title: "Insights from the TMA traffic: 600+ apps audience research", description: "Vadim Sterlin, CEO & Founder, Adsgram" },
    { time: "15:45", title: "Sign: The biggest airdrop in Web3", description: "Xin Yan, CEO, Sign" },
    { time: "15:55", title: "Web3 Gaming and Beyond: Cocos Meets TON and Telegram", description: "Luna, CMO of Cocos Studio" },
    { time: "16:05", title: "TON as the best ecosystem for teams: support and incentive programs", description: "Alena Shmalko, Ecosystem Lead, TON Foundation" },
    { time: "16:20", title: "Panel: The Open League Winners", description: "Tradoor, Hipo, Torch, Crouton" },
    { time: "16:40", title: "Ton Accelerator: The Application Thesis", description: "Sophia Rusconi, Head of Acceleration & Sami Al-Abed, Head of DeFi" },
    { time: "16:47", title: "HashKey keynote" },
    { time: "17:00", title: "Hackers League", description: "Ekin Tuna, Co-founder, TON Society" },
    { time: "17:10", title: "How to make TON great: Lessons from a seed investor in Eth, Sol, and Dot", description: "Jehan Chu, Founder, Kenetic" },
    { time: "17:20", title: "Raffle for the Gateway attendees from sponsors" },
    { time: "17:30", title: "Group photo and closing of the conference" },
    { time: "17:40", title: "Networking and exploring the exhibition area" },
    { time: "19:30", title: "The Gateway Official Afterparty", description: "Networking and celebrating" }
  ];
  
  
  
  
  
  

  const renderAgenda = (agenda: any[]) =>
    agenda.map((item, index) => (
      <div className="relative flex items-start gap-4" key={index}>
        {/* Line before the bullet except the first */}

       <div className="absolute left-[-6px] top-0 h-full w-[2px] bg-gray-300"></div>


        {/* Bullet and time */}
        <div className="relative">

          <div className="font-semibold text-lg">{item.time}</div>
          <p>{item.title}</p>
          {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
        </div>

        {/* Content */}



      </div>
    ));

  return (
    <div className={"text-telegram-text-color"}>
      <h2 className={"type-title-3 font-bold mb-4"}>Agenda</h2>

      {/* 1 November */}
      <div className={"mt-4"}>
        <button
          className={
            "cursor-pointer bg-blue-500  text-sm   w-full text-center  text-white py-2 rounded-sm shadow-md transition-colors duration-300 ease-in-out  "
          }
          onClick={toggle1Nov}
        >
          1 November {isOpen1Nov ? "-" : "+"}
        </button>
        {isOpen1Nov && (
          <div className={"mt-2 mx-3 grid gap-y-4 relative"}>
            {renderAgenda(agenda1Nov)}
          </div>
        )}
      </div>

      {/* 2 November */}
      <div className={"mt-4"}>
        <button
          className={
            "cursor-pointer bg-blue-500  text-sm   w-full text-center  text-white py-2 rounded-sm shadow-md transition-colors duration-300 ease-in-out  "
          }
          onClick={toggle2Nov}
        >
          2 November {isOpen2Nov ? "-" : "+"}
        </button>
        {isOpen2Nov && (
          <div className={"mt-2 mx-3 grid gap-y-4 relative"}>
            {renderAgenda(agenda2Nov)}
          </div>
        )}
      </div>
    </div>
  );
};

export default GatewayAgenda;
