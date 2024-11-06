import { Item } from '@/utils/types';
import { useEffect, useState } from 'react';

export default function HomePage(props: { searchInput: string, sortBy: string }) {
  const [result, setResult] = useState<Item[]>([]);

  useEffect(() => {
    console.log("Search: " + props.searchInput);
    console.log("Sort: " + props.sortBy);
    const fetchData = async () => {
      const payload = {
        query: props.searchInput, // need to get all items sorted by some default
        sortBy: props.sortBy,
      };
      try {
        const response = await fetch('https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/searchItems',
          {
            method: 'POST',
            body: JSON.stringify(payload),
          });

        const resultData: { statusCode: 200 | 400, items: Item[] } = await response.json();
        console.log(resultData);
        if (resultData.statusCode == 200) {
          setResult(resultData.items);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, [props.searchInput, props.sortBy]);

  return (
    <div className="ItemDisplay">
      {/*do something with result here*/}
      {result.length > 0 ? (
        result.map((item, index) => (
          <div key={index} className="item">
            <img src={item.image} alt={item.name} style={{ width: '200px', height: 'auto' }} />
            <h3>{item.name}</h3>
            <p> Description: {item.description} </p>
            <p> Start Date: {item.startDate.toString()} </p>
            <p> End Date: {item.endDate?.toString()} </p>
            <p> ${item.price} </p>
          </div>
        ))
      ) : (
        <p>No items found.</p>
      )}
    </div>
  );
}