"use client";

// hooks/useElementData.ts
import { useState, useEffect } from 'react';
import { elements } from '../utils/elementsData';
import { Element } from '../types/element';

export const useElementData = () => {
  // Specify the type for useState
  const [elementData, setElementData] = useState<Element[]>([]); // Initialize with type Element[]

  useEffect(() => {
    // Simulate fetching data (or you can fetch from an API)
    setElementData(elements); // Assuming 'elements' is your data array
  }, []);

  return elementData;
};

export default useElementData;