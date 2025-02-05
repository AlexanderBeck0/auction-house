import { Item } from '@/utils/types';
import { useEffect, useState } from 'react';
import ItemDisplay from './ItemDisplay';
import { Link } from 'react-router-dom';

export default function HomePage(props: { searchInput: string, sortBy: string, recentlySold: boolean }) {
  const [result, setResult] = useState<Item[]>([]);

  // #region searchItems
  useEffect(() => {
    const fetchData = async () => {
      const payload = {
        query: props.searchInput,
        sortBy: props.sortBy,
        recentlySold: props.recentlySold,
      };
      try {
        try {
          await fetch('https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/complete-items', { method: 'GET' });
        } catch (error) {
          console.error('Error updating items to be complete:', error)
        }
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
  }, [props.searchInput, props.sortBy, props.recentlySold]);
  // #endregion

  return (
    <div className="ItemDisplay">
      {result.length > 0 ? (
        result.map((item, index) => (
          <Link key={index} to={`/item/${item.id}`}>
            <ItemDisplay key={index} item={item} />
          </Link>
        ))
      ) : (
        <p>No items found.</p>
      )}
    </div>
  );
}