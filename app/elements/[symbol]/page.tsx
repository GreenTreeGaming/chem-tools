"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation"; // Import useRouter
import axios from "axios";
import { elements } from "../../../utils/elementsData"; // Adjust the path as necessary
import { Element } from "../../../types/element"; // Ensure the correct path
import { facts } from "../../../utils/elementsFacts";

const categoryColors: { [key: string]: string } = {
  "alkali metal": "bg-yellow-300 text-yellow-900",
  "alkaline earth metal": "bg-green-300 text-green-900",
  "transition metal": "bg-blue-300 text-blue-900",
  "post-transition metal": "bg-orange-300 text-orange-900",
  "metalloid": "bg-purple-300 text-purple-900",
  "nonmetal": "bg-pink-300 text-pink-900",
  "halogen": "bg-red-300 text-red-900",
  "noble gas": "bg-indigo-300 text-indigo-900",
  "lanthanide": "bg-teal-300 text-teal-900",
  "actinide": "bg-cyan-300 text-cyan-900",
};

const backgroundColors: { [key: string]: string } = {
  "alkali metal": "bg-yellow-100",
  "alkaline earth metal": "bg-green-100",
  "transition metal": "bg-blue-100",
  "post-transition metal": "bg-orange-100",
  "metalloid": "bg-purple-100",
  "nonmetal": "bg-pink-100",
  "halogen": "bg-red-100",
  "noble gas": "bg-indigo-100",
  "lanthanide": "bg-teal-100",
  "actinide": "bg-cyan-100",
};

const ElementDetail = () => {
  const pathname = usePathname(); // Get the current pathname
  const router = useRouter(); // Get the router for navigation
  const symbol = pathname.split("/").pop(); // Extract the symbol from the URL path
  const [element, setElement] = useState<Element | null>(null); // Define the type for element
  const [imageUrl, setImageUrl] = useState<string | null>(null); // State to hold the image URL

  useEffect(() => {
    if (symbol) {
      const foundElement = elements.find(
        (el) => el.symbol.toLowerCase() === symbol.toLowerCase()
      );
      setElement(foundElement || null); // Set to null if not found
      if (foundElement) {
        fetchElementImage(foundElement.name); // Fetch the image
      }
    }
  }, [symbol]);

  // Function to fetch the image from Wikipedia
  const fetchElementImage = async (elementName: string) => {
    try {
      const response = await axios.get(
        `https://en.wikipedia.org/w/api.php`,
        {
          params: {
            action: "query",
            titles: elementName,
            prop: "pageimages",
            format: "json",
            pithumbsize: 800, // Increased size for higher quality
            origin: "*", // Required to bypass CORS
          },
        }
      );

      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0]; // Get the first page ID
      if (pages[pageId].thumbnail) {
        setImageUrl(pages[pageId].thumbnail.source); // Set the image URL from the response
      } else {
        setImageUrl(null); // If no image is available, set to null
      }
    } catch (error) {
      console.error("Error fetching image from Wikipedia:", error);
      setImageUrl(null);
    }
  };

  if (!element) {
    return <div>Loading...</div>; // This will stay if the element is not found
  }

  // Get the color classes based on the element's category
  const colorClass = categoryColors[element.category.toLowerCase()] || "bg-gray-300 text-gray-900";
  const backgroundColorClass = backgroundColors[element.category.toLowerCase()] || "bg-gray-100";

  // Construct the Wikipedia link
  const wikipediaLink = `https://en.wikipedia.org/wiki/${element.name}`;

  // Function to render electron configuration with clickable noble gas symbols
  const renderElectronConfiguration = (config: string) => {
    const regex = /\[(.*?)\]/g; // Regex to match [He], [Ne], etc.
    const parts = config.split(regex); // Split by noble gas symbols
    return parts.map((part, index) => {
      // Check if the part is a noble gas
      if (index % 2 === 1) {
        // Odd indexes will be noble gas symbols
        const nobleGasSymbol = part.trim();
        const nobleGasElement = elements.find(el => el.symbol === nobleGasSymbol);
        return nobleGasElement ? (
          <a
            key={index}
            href={`/elements/${nobleGasSymbol}`} // Adjust this URL structure if needed
            className="text-blue-500 underline"
          >
            [{nobleGasSymbol}]
          </a>
        ) : (
          <span key={index}>[{nobleGasSymbol}]</span>
        );
      }
      return part; // Return the rest of the string as-is
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${backgroundColorClass}`}>
      <div className="absolute top-4 left-4"> {/* Positioning the back button */}
        <button
          onClick={() => router.back()} // Handle back navigation
          className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition duration-200"
        >
          Back
        </button>
      </div>
      <div className={`p-6 max-w-3xl mx-auto shadow-md rounded-lg ${colorClass}`}>
        <h1 className="text-5xl font-bold mb-4">
          {element.name} ({element.symbol})
        </h1>
        <p className="text-lg">
          <strong>Atomic Number:</strong> {element.atomicNumber}
        </p>
        <p className="text-lg">
          <strong>Atomic Weight:</strong> {element.atomicWeight.toFixed(3)}
        </p>
        <p className="text-lg">
          <strong>Category:</strong> {element.category}
        </p>
        <p className="text-lg">
          <strong>Electron Configuration:</strong> {renderElectronConfiguration(element.electronConfiguration)}
        </p>

        {/* Additional Information */}
        <div className="mt-4">
          <h2 className="text-2xl font-semibold">Properties</h2>
          <ul className="list-disc ml-6">
            <li>
              <strong>Phase:</strong> {element.phase}
            </li>
            <li>
              <strong>Density:</strong> {element.density !== null ? element.density.toFixed(2) : "Not found"} g/cm³
            </li>
            <li>
              <strong>Melting Point:</strong> {element.meltingPoint !== null ? element.meltingPoint.toFixed(2) : "Not found"} °C
            </li>
            <li>
              <strong>Boiling Point:</strong> {element.boilingPoint !== null ? element.boilingPoint.toFixed(2) : "Not found"} °C
            </li>
          </ul>
        </div>

        {/* Image Representation */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold">Image</h2>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={element.name}
              className="max-w-xs h-auto mx-auto rounded-md" // Limits width to 300px while maintaining aspect ratio
            />
          ) : (
            <p>No image available</p>
          )}
        </div>

        {/* Fun Fact */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold">Fun Fact</h2>
          <p className="italic">{getFunFact(element.symbol)}</p>
        </div>

        {/* Wikipedia Link */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold">Learn More</h2>
          <a
            href={wikipediaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Read more about {element.name} on Wikipedia
          </a>
        </div>
      </div>
    </div>
  );
};

const getFunFact = (symbol: string) => {
  return facts[symbol] || "No fun fact available.";
};

export default ElementDetail;