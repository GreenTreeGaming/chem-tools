import Link from 'next/link';
import { Element } from '../types/element';
import { getElementColor } from '../utils/elementColors';

export const ElementCard = ({ atomicNumber, symbol, name, category }: Element) => {
  // Log the category to check its value
  console.log('Category:', category); // Add this line

  const colorClass = getElementColor(category);
  console.log('Color Class:', colorClass);

  return (
    <Link href={`/elements/${symbol}`} passHref>
      <div
        className={`p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-all ${colorClass}`}
      >
        <p className="text-sm">#{atomicNumber}</p>
        <h2 className="text-3xl font-bold">{symbol}</h2>
        <p className="text-lg">{name}</p>
      </div>
    </Link>
  );
  // const testClass = 'bg-red-500 text-blue-500'; // Change as needed for testing

  // return (
  //   <Link href={`/elements/${symbol}`} passHref>
  //     <div
  //       className={`p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-all ${colorClass} ${testClass}`}
  //     >
  //       <p className="text-sm">#{atomicNumber}</p>
  //       <h2 className="text-3xl font-bold">{symbol}</h2>
  //       <p className="text-lg">{name}</p>
  //     </div>
  //   </Link>
  // );
};