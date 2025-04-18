import React, { useState } from 'react';

const CountryList = ({ onSelectCountry }) => {
    const countries = [
        {
            name: 'United States',
            code: 'US',
            dialCode: '+1',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <g>
                        <rect width="900" height="46.15" y="0" fill="#B22234" />
                        <rect width="900" height="46.15" y="92.3" fill="#B22234" />
                        <rect width="900" height="46.15" y="184.6" fill="#B22234" />
                        <rect width="900" height="46.15" y="276.9" fill="#B22234" />
                        <rect width="900" height="46.15" y="369.2" fill="#B22234" />
                        <rect width="900" height="46.15" y="461.5" fill="#B22234" />
                        <rect width="900" height="46.15" y="553.8" fill="#B22234" />
                        <rect width="360" height="323.1" fill="#3C3B6E" />
                        <g fill="#FFFFFF">
                            {[...Array(5)].map((_, i) => (
                                <g key={`row-${i}`}>
                                    {[...Array(6)].map((_, j) => (
                                        <circle key={`star-${i}-${j}`} cx={30 + j * 60} cy={30 + i * 60} r="10" />
                                    ))}
                                </g>
                            ))}
                            {[...Array(4)].map((_, i) => (
                                <g key={`offset-row-${i}`}>
                                    {[...Array(5)].map((_, j) => (
                                        <circle key={`offset-star-${i}-${j}`} cx={60 + j * 60} cy={60 + i * 60} r="10" />
                                    ))}
                                </g>
                            ))}
                        </g>
                    </g>
                </svg>
            )
        },
        {
            name: 'United Kingdom',
            code: 'GB',
            dialCode: '+44',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#012169" />
                    <path d="M0,0 L900,600 M900,0 L0,600" stroke="#fff" strokeWidth="60" />
                    <path d="M450,0 L450,600 M0,300 L900,300" stroke="#fff" strokeWidth="100" />
                    <path d="M450,0 L450,600 M0,300 L900,300" stroke="#C8102E" strokeWidth="60" />
                    <path d="M0,0 L900,600 M900,0 L0,600" stroke="#C8102E" strokeWidth="40" />
                </svg>
            )
        },
        {
            name: 'India',
            code: 'IN',
            dialCode: '+91',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect width="900" height="200" fill="#FF9933" />
                    <rect width="900" height="200" y="400" fill="#138808" />
                    <circle cx="450" cy="300" r="60" fill="#000080" />
                    <circle cx="450" cy="300" r="50" fill="#f8f9fa" />
                    <circle cx="450" cy="300" r="8.5" fill="#000080" />
                    <circle cx="450" cy="300" r="60" fill="none" stroke="#000080" strokeWidth="1" />
                    <g transform="translate(450,300)">
                        {[...Array(24)].map((_, i) => (
                            <line
                                key={i}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="-45"
                                stroke="#000080"
                                strokeWidth="1"
                                transform={`rotate(${i * 15})`}
                            />
                        ))}
                    </g>
                </svg>
            )
        },
        {
            name: 'Canada',
            code: 'CA',
            dialCode: '+1',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect x="0" width="225" height="600" fill="#D80621" />
                    <rect x="675" width="225" height="600" fill="#D80621" />
                    <rect x="225" width="450" height="600" fill="#f8f9fa" />
                    <path d="M450,140 L470,200 L535,200 L480,240 L500,300 L450,260 L400,300 L420,240 L365,200 L430,200 Z" fill="#D80621" />
                </svg>
            )
        },
        {
            name: 'Australia',
            code: 'AU',
            dialCode: '+61',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#00008B" />
                    <g transform="translate(0, 0) scale(0.5)">
                        <rect width="180" height="100" x="0" y="0" fill="#012169" />
                        <path d="M0,0 L180,100 M180,0 L0,100" stroke="#fff" strokeWidth="20" />
                        <path d="M90,0 L90,100 M0,50 L180,50" stroke="#fff" strokeWidth="30" />
                        <path d="M90,0 L90,100 M0,50 L180,50" stroke="#C8102E" strokeWidth="18" />
                        <path d="M0,0 L180,100 M180,0 L0,100" stroke="#C8102E" strokeWidth="12" />
                    </g>
                    <g fill="#fff">
                        <polygon points="450,150 465,195 512,195 475,225 490,270 450,240 410,270 425,225 388,195 435,195" />
                        <polygon points="700,350 709,377 738,377 715,393 724,420 700,404 676,420 685,393 662,377 691,377" />
                        <polygon points="700,100 709,127 738,127 715,143 724,170 700,154 676,170 685,143 662,127 691,127" />
                        <polygon points="600,250 609,277 638,277 615,293 624,320 600,304 576,320 585,293 562,277 591,277" />
                        <polygon points="800,200 809,227 838,227 815,243 824,270 800,254 776,270 785,243 762,227 791,227" />
                        <polygon points="700,500 709,527 738,527 715,543 724,570 700,554 676,570 685,543 662,527 691,527" />
                    </g>
                </svg>
            )
        },
        {
            name: 'Germany',
            code: 'DE',
            dialCode: '+49',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect width="900" height="200" y="0" fill="#000" />
                    <rect width="900" height="200" y="200" fill="#DD0000" />
                    <rect width="900" height="200" y="400" fill="#FFCE00" />
                </svg>
            )
        },
        {
            name: 'France',
            code: 'FR',
            dialCode: '+33',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect width="300" height="600" x="0" fill="#002654" />
                    <rect width="300" height="600" x="300" fill="#FFFFFF" />
                    <rect width="300" height="600" x="600" fill="#ED2939" />
                </svg>
            )
        },
        {
            name: 'Brazil',
            code: 'BR',
            dialCode: '+55',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#009c3b" />
                    <path d="M450,100 L800,300 L450,500 L100,300 Z" fill="#ffdf00" />
                    <circle cx="450" cy="300" r="120" fill="#002776" />
                    <path d="M450,220 A80,80 0 0 1 530,300 A80,80 0 0 1 450,380 A80,80 0 0 1 370,300 A80,80 0 0 1 450,220" fill="#f8f9fa" />
                </svg>
            )
        },
        {
            name: 'Japan',
            code: 'JP',
            dialCode: '+81',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <circle cx="450" cy="300" r="120" fill="#bc002d" />
                </svg>
            )
        },
        {
            name: 'China',
            code: 'CN',
            dialCode: '+86',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#de2910" />
                    <g fill="#ffde00">
                        <polygon points="150,100 187,213 100,155 200,155 113,213" />
                        <polygon points="270,130 280,160 250,145 290,145 260,160" />
                        <polygon points="300,180 310,210 280,195 320,195 290,210" />
                        <polygon points="270,240 280,270 250,255 290,255 260,270" />
                        <polygon points="220,210 230,240 200,225 240,225 210,240" />
                    </g>
                </svg>
            )
        },
        {
            name: 'Italy',
            code: 'IT',
            dialCode: '+39',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect width="300" height="600" x="0" fill="#009246" />
                    <rect width="300" height="600" x="300" fill="#FFFFFF" />
                    <rect width="300" height="600" x="600" fill="#CE2B37" />
                </svg>
            )
        },
        {
            name: 'Spain',
            code: 'ES',
            dialCode: '+34',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#c60b1e" />
                    <rect width="900" height="300" y="150" fill="#ffc400" />
                </svg>
            )
        },
        {
            name: 'Mexico',
            code: 'MX',
            dialCode: '+52',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect width="300" height="600" x="0" fill="#006847" />
                    <rect width="300" height="600" x="600" fill="#ce1126" />
                    <circle cx="450" cy="300" r="70" fill="#f8f9fa" />
                </svg>
            )
        },
        {
            name: 'Russia',
            code: 'RU',
            dialCode: '+7',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect width="900" height="200" y="0" fill="#FFFFFF" />
                    <rect width="900" height="200" y="200" fill="#0039A6" />
                    <rect width="900" height="200" y="400" fill="#D52B1E" />
                </svg>
            )
        },
        {
            name: 'South Africa',
            code: 'ZA',
            dialCode: '+27',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#ffffff" />
                    <rect width="900" height="150" y="150" fill="#002395" />
                    <rect width="900" height="150" y="300" fill="#de3831" />
                    <path d="M0,0 L450,300 L0,600 Z" fill="#002395" />
                    <path d="M150,300 L0,600 L0,0 Z" fill="#ffb612" />
                    <path d="M0,0 L450,300 L900,0 Z" fill="#000000" />
                    <path d="M0,600 L450,300 L900,600 Z" fill="#000000" />
                </svg>
            )
        },
        {
            name: 'Netherlands',
            code: 'NL',
            dialCode: '+31',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect width="900" height="200" y="0" fill="#AE1C28" />
                    <rect width="900" height="200" y="200" fill="#FFFFFF" />
                    <rect width="900" height="200" y="400" fill="#21468B" />
                </svg>
            )
        },
        {
            name: 'Sweden',
            code: 'SE',
            dialCode: '+46',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#006AA7" />
                    <rect width="150" height="600" x="250" fill="#FECC00" />
                    <rect width="900" height="150" y="225" fill="#FECC00" />
                </svg>
            )
        },
        {
            name: 'Switzerland',
            code: 'CH',
            dialCode: '+41',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#D8232A" />
                    <rect width="160" height="500" x="370" y="50" fill="#FFFFFF" />
                    <rect width="500" height="160" x="200" y="220" fill="#FFFFFF" />
                </svg>
            )
        },
        {
            name: 'Norway',
            code: 'NO',
            dialCode: '+47',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#EF2B2D" />
                    <rect width="200" height="600" x="225" fill="#FFFFFF" />
                    <rect width="900" height="200" y="200" fill="#FFFFFF" />
                    <rect width="100" height="600" x="275" fill="#002868" />
                    <rect width="900" height="100" y="250" fill="#002868" />
                </svg>
            )
        },
        {
            name: 'South Korea',
            code: 'KR',
            dialCode: '+82',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#FFFFFF" />
                    <circle cx="450" cy="300" r="150" fill="#CD2E3A" />
                    <path d="M450,150 A150,150 0 0 1 600,300 A150,150 0 0 1 450,450" fill="#0047A0" />
                    <path d="M450,150 A150,150 0 0 0 300,300 A150,150 0 0 0 450,450" fill="#000000" />
                </svg>
            )
        },
        {
            name: 'Belgium',
            code: 'BE',
            dialCode: '+32',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect width="300" height="600" x="0" fill="#000000" />
                    <rect width="300" height="600" x="300" fill="#FFD90C" />
                    <rect width="300" height="600" x="600" fill="#F31830" />
                </svg>
            )
        },
        {
            name: 'Portugal',
            code: 'PT',
            dialCode: '+351',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect width="300" height="600" x="0" fill="#006600" />
                    <rect width="600" height="600" x="300" fill="#FF0000" />
                    <circle cx="300" cy="300" r="100" fill="#FFCC00" />
                </svg>
            )
        },
        {
            name: 'Greece',
            code: 'GR',
            dialCode: '+30',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#0D5EAF" />
                    <rect width="900" height="67" y="67" fill="#FFFFFF" />
                    <rect width="900" height="67" y="200" fill="#FFFFFF" />
                    <rect width="900" height="67" y="333" fill="#FFFFFF" />
                    <rect width="900" height="67" y="467" fill="#FFFFFF" />
                    <rect width="250" height="300" x="0" y="0" fill="#0D5EAF" />
                    <rect width="250" height="67" x="0" y="67" fill="#FFFFFF" />
                    <rect width="67" height="300" x="92" y="0" fill="#FFFFFF" />
                </svg>
            )
        },
        {
            name: 'Turkey',
            code: 'TR',
            dialCode: '+90',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#E30A17" />
                    <circle cx="300" cy="300" r="150" fill="#FFFFFF" />
                    <circle cx="350" cy="300" r="120" fill="#E30A17" />
                    <polygon points="500,300 520,380 440,330 560,330 480,380" fill="#FFFFFF" />
                </svg>
            )
        },
        {
            name: 'Poland',
            code: 'PL',
            dialCode: '+48',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#f8f9fa" />
                    <rect width="900" height="300" y="0" fill="#FFFFFF" />
                    <rect width="900" height="300" y="300" fill="#DC143C" />
                </svg>
            )
        },
        {
            name: 'Thailand',
            code: 'TH',
            dialCode: '+66',
            flag: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#A51931" />
                    <rect width="900" height="100" y="100" fill="#F4F5F8" />
                    <rect width="900" height="200" y="200" fill="#2D2A4A" />
                    <rect width="900" height="100" y="400" fill="#F4F5F8" />
                </svg>
            )
        },
    ];

    const [searchQuery, setSearchQuery] = useState('');
    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className='p-2 sticky top-0 bg-[#2c2c2c] border-gray-700'>
            <input
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a]/50 text-white p-2 mb-2 rounded-md focus:outline-none"
            />
            <ul className="overflow-auto">
                {filteredCountries.sort((a, b) => a.name.localeCompare(b.name)).map((country) => (
                    <li
                        key={country.code}
                        className="px-3 py-2 hover:bg-gray-700  rounded-md cursor-pointer text-white flex items-center gap-2"
                        onClick={() => onSelectCountry(country)}
                    >
                        <div className="w-6 h-4 overflow-hidden">
                            {country.flag}
                        </div>
                        <span>{country.name}</span>
                        <span className="text-gray-400 text-sm ml-auto">{country.dialCode}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CountryList;
