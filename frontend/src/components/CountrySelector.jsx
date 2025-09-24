"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { countries } from "../lib/countries";

export default function CountrySelector({ value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const selectedCountry = countries.find((country) => country.code === value);

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (countryCode) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-border rounded-xl hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
      >
        <div className="flex items-center space-x-3">
          {selectedCountry ? (
            <>
              <img
                src={`/assets/images/flags/${selectedCountry.code.toLowerCase()}.svg`}
                alt={selectedCountry.name}
                className="w-6 h-4 object-cover rounded"
                onError={(e) => {
                  // Fallback to a placeholder if flag image fails to load
                  e.target.src = "/diverse-flags.png";
                }}
              />
              <span className="font-medium">{selectedCountry.name}</span>
              <span className="text-sm text-muted-foreground">({selectedCountry.code})</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-xl shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country.code)}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-muted transition-colors duration-150 text-left"
              >
                <img
                  src={`/assets/images/flags/${country.code.toLowerCase()}.svg`}
                  alt={country.name}
                  className="w-6 h-4 object-cover rounded"
                  onError={(e) => {
                    e.target.src = "/diverse-flags.png";
                  }}
                />
                <span className="font-medium">{country.name}</span>
                <span className="text-sm text-muted-foreground">({country.code})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
