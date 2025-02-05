import type { AccountType, Bid, Item } from '@/utils/types';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TimeDisplay from '../TimeDisplay';
import BuyerItemPage from './BuyerItemPage';
import SellerItemPage from './SellerItemPage';

interface ItemPageProps {
    accountType: AccountType | null;
    token: string | null;
}

export default function ItemPage(props: ItemPageProps) {
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<Item | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchItem = useCallback(async () => {
        const payload = { id: id, token: props.token };

        await fetch("https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/getItemFromID", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }).then(response => response.json()).then(data => {
            if (data.statusCode !== 200) throw data.error;
            if (data.statusCode === 200) {
                setItem(data.item);
                setBids(data.item?.bids ? (data.item.bids) : []); // JSON.parse on bids was throwing an error
            }
        }).catch(error => {
            // Log actual errors and not just insufficient permission errors
            if (error instanceof Error) console.error(error);
            if (typeof error === 'string' && error.includes("jwt expired")) {
                setErrorMessage("Please log in to see this page.");
                return;
            }
            setErrorMessage(error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error));
        });
    }, [id, props.token]);

    useEffect(() => {
        fetchItem();
    }, [fetchItem, id, props]);

    return (
        <div style={{ display: 'flex', padding: '2rem', gap: '2rem' }}>
            {!!errorMessage && <p>{errorMessage}</p>}
            {!!!errorMessage && (item ? (
                <>
                    {/* Left Container */}
                    <div style={{ width: '33%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h2>{item.name}</h2>
                        <picture>
                            <img src={item.image} alt={item.name} style={{ width: '100%', height: 'auto' }} />
                        </picture>
                        <p><strong>Description: </strong> {item.description}</p>
                        <TimeDisplay startDate={item.startDate} endDate={item.endDate} />
                    </div>

                    {/* Middle Container */}
                    <div style={{ width: '33%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p><strong>{item.archived ? "Final" : item.forSale ? "" : "Current"} Price:</strong> ${item.price}</p>
                        {props.accountType !== null && !item.forSale && <> {/** if item for sale, no bids. !!!do we need to show bought by for seller */}

                            <h3>Bids:</h3>
                            {bids.length > 0 ? (
                                <ul>
                                    {bids.map((bid, index) => (
                                        <li key={index}>${bid.bid} by {bid.buyer_username} on {typeof bid.timeOfBid === "string" ? new Date(bid.timeOfBid).toLocaleString() : bid.timeOfBid.toLocaleString()}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No bids placed yet.</p>
                            )}
                        </>
                        }
                        {
                            props.accountType === "Seller" && <SellerItemPage status={item.status} item_id={item.id} archived={item.archived} />
                        }
                        {
                            props.accountType === "Buyer" && <BuyerItemPage status={item.status} item_id={item.id} itemForSale={item.forSale} price={item.price ? item.price : item.initialPrice} fetchItem={fetchItem} />
                        }

                    </div>
                </>
            ) : (
                <p>Loading...</p>
            ))}
        </div>
    );
}
