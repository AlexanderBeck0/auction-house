import type { AccountType, Bid, Item } from '@/utils/types';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TimeDisplay from '../TimeDisplay';
import EditItemForm from './EditItemForm';

interface ItemPageProps {
    accountType: AccountType | null;
    token: string | null;
}

export default function ItemPage(props: ItemPageProps) {
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<Item | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);
    const [forSale, setForSale] = useState(false);
    const [published, setPublished] = useState<boolean | null>(null);
    const [archived, setArchived] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    /**
     * Used when there is a fatal error that should prevent the page from being shown.
     */
    const [fatalErrorMessage, setFatalErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate()

    useEffect(() => {
        // Ensure that if the item is archived, the Seller is taken to view item instead of edit
        if (archived) {
            navigate(`/item/${id}`)
        }
    }, [archived, id, navigate]);

    async function unpublish(id: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const payload = { token: props.token, item_id: id };

            fetch("https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/unpublishItem", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload)
            }).then(response => response.json()).then(data => {
                if (data.statusCode === 200) {
                    setPublished(false);
                    return resolve("Successfully published item!");
                }

                if (data?.error !== undefined) {
                    if (data.error.includes("jwt expired")) {
                        throw new Error("Your token has expired. Please log in again.");
                    }
                    return reject(data.error);
                }

            }).catch(error => setFatalErrorMessage(error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error)));
        })

    }

    async function archive(id: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const payload = { token: props.token, item_id: id };
            fetch("https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/archive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).then(response => response.json()).then(data => {
                if (data.statusCode === 200) {
                    setArchived(true);
                    return resolve("Successfully archived item!");
                }

                if (data?.error !== undefined) {
                    if (data.error.includes("jwt expired")) {
                        throw new Error("Your token has expired. Please log in again.");
                    }
                    return reject(data.error); // Non-fatal error handling
                }
            }).catch(error => setFatalErrorMessage(error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error)))
        })
    }

    async function publish(id: number, forSale: boolean): Promise<string> {
        return new Promise((resolve, reject) => {

            const payload = { token: props.token, item_id: id, forSale: forSale };
            fetch("https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/publishItem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).then(response => response.json()).then(data => {
                if (data.error) {
                    if (data.error.includes("jwt expired")) {
                        throw new Error("Your token has expired. Please log in again.");
                    }
                    return reject(data.error);
                }

                setPublished(true);
                return resolve("Successfully published item!");

            }).catch(error => {
                setFatalErrorMessage(error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error));
            })
        })
    };

    const remove = useCallback(async (id: number): Promise<void> => {
        const payload = { token: props.token, item_id: id };
        try {
            const response = await fetch("https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/remove-item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (data.error) {
                if (data.error.includes("jwt expired")) {
                    throw new Error("Your token has expired. Please log in again.");
                }
                setErrorMessage(data.error);
            } else {
                console.log("Successfully removed item!");
            }
        } catch (error) {
            setFatalErrorMessage(error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error));
        }
    }, [props.token]);

    /**
     * Function to call when fetching an item.
     */
    const fetchItem = useCallback(async (): Promise<void> => {
        const payload = { id: id, token: props.token };
        try {
            const response = await fetch("https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/getItemFromID", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (data.statusCode === 200) {
                setItem(data.item);
                setBids(data.item?.bids ? data.item.bids : []);
                setPublished(data.item.status === 'Active');
                setForSale(data.item.forSale === 1);
                setArchived(data.item.archived === 1);
                return;
            }
            if (data?.error !== undefined) {
                if (data.error.includes("jwt expired")) {
                    throw new Error("Your token has expired. Please log in again.");
                }
                setErrorMessage(data.error); // Non-fatal error handling
            }

        } catch (error) {
            // Fatal error (not an expected error)
            setFatalErrorMessage(typeof error === "string" ? error : error instanceof Error ? error.message : JSON.stringify(error));
        }
    }, [id, props.token]);

    useEffect(() => {
        fetchItem();
    }, [fetchItem, id, props, published]);

    useEffect(() => {
        setPublished(item?.status === 'Active')
        setArchived(item?.archived === true)
    }, [item]);

    /**
     * @param changes The changes to be made.
     * @returns A string promise of the resulting message. Could be a success message, or an error message.
     */
    async function handleEdit(changes: object): Promise<string> {
        /**
         * @param str The date string to check.
         * @returns A boolean representing if str is a date string.
         */
        const isDate = (str: string): boolean => {
            return !isNaN(new Date(str).getTime()) && str.indexOf("T") !== -1;
        }

        // Create a new item that contains all the new changes
        const newItem: Partial<Item> = { ...item }!;
        Object.entries(changes).forEach(([key, value]) => {
            if (key in newItem) {
                // Convert date to ISO format
                if (isDate(value)) {
                    value = new Date(value).toISOString().slice(0, -8)
                }
                newItem[key as keyof Item] = value;
            }
        });

        return new Promise((resolve, reject) => {
            fetch("https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/saveItem", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: localStorage.getItem("token"),
                    item: newItem
                }),
            }).then(response => response.json()).then(data => {
                if (data.statusCode !== 200) {
                    console.error(data.error);
                    reject(data.error);
                }
                resolve("Successfully edited item!");
                fetchItem();
            }).catch(error => {
                console.error(error);
                reject(error instanceof Error ? error.message : typeof error === "string" ? error : error);
            });
        });
    }

    async function handlePublishClick(): Promise<void> {
        if (item?.status === "Frozen") {
            setErrorMessage("Frozen items cannot be published!");
            return;
        }
        if (item?.status === 'Active') {
            await unpublish(Number(id)).then(() => setErrorMessage(null)).catch((error) => setErrorMessage(error));
        }
        if (item?.status === 'Inactive') {
            publish(Number(id), forSale).then(() => setErrorMessage(null)).catch((error) => setErrorMessage(error));
        }
    }

    async function handleArchiveClick(): Promise<void> {
        if (item?.status === 'Inactive') {
            await archive(Number(id)).then(() => {
                console.log("Archived item")
            }).catch((error) => setErrorMessage(error));
        }
    }

    function handleRemoveClick(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (item?.status === 'Inactive') {
                remove(Number(id))
                    .then(() => {
                        navigate('/account');
                        resolve();
                    })
                    .catch((error) => {
                        console.error(error)
                        reject(error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error));
                    });
            }
        });
    }

    async function handleRequestUnfreeze() {
        const payload = {
            token: localStorage.getItem('token'),
            id: id,
        };
        try {
            const response = await fetch('https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/requestUnfreezeItem',
                {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });

            const resultData = await response.json();
            if (resultData.statusCode == 200) {
                console.log("item status is requested");
                fetchItem();
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    return (
        <div style={{ display: 'flex', padding: '2rem', gap: '2rem' }}>
            {/* Would probably be better to use an ErrorBoundary but I do not have the time to look into it */}
            {!!fatalErrorMessage && <p className="text-lg">{fatalErrorMessage}</p>}
            {!!!fatalErrorMessage && (item ? (
                <>
                    {/* Left Container */}
                    <div style={{ width: '33%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h2>{item.name}</h2>
                        <picture>
                            <img src={item.image} alt={item.name} style={{ width: '100%', height: 'auto' }} />
                        </picture>
                        <p><strong>Description: </strong> {item.description}</p>
                        <TimeDisplay startDate={item.startDate} endDate={item.endDate} />
                        <p><strong>Status: </strong> {item.status}</p>
                    </div>

                    {/* Middle Container */}
                    <div className="w-1/3 flex flex-col gap-4">
                        {/* Bids */}
                        <div>
                            <p><strong>Current Price:</strong> ${item.price}</p>
                            <h3>Bids:</h3>
                            {bids.length > 0 ? (
                                <ul>
                                    {bids.map((bid, index) => (
                                        <li key={index}>${bid.bid} by {bid.buyer_username}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No bids placed yet.</p>
                            )}
                            {published && <p>{forSale ? "This item is able to be bought NOW!" : "This item is up for normal auction"}</p>}
                        </div>
                        {/* Edit Controls */}
                        {item.status === "Inactive" && bids.length === 0 &&
                            <EditItemForm item={item} handleEdit={handleEdit} />
                        }
                    </div>
                    {/* Controls */}
                    <div style={{ width: '33%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(item.status === "Frozen" || item.status === "Requested") && (
                            <button className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:cursor-not-allowed disabled:bg-gray-500"
                                disabled={item.status === "Requested"}
                                onClick={handleRequestUnfreeze}>{item.status === "Frozen" ? "Request Unfreeze" : "Requested!"}</button>

                        )}

                        {/* for sale button: */}
                        {!published &&
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', }}>
                                <input
                                    type="checkbox"
                                    checked={forSale}
                                    onChange={(e) => setForSale(e.target.checked)}
                                    style={{ width: '20px', height: '20px' }}
                                    disabled={(item.status === "Frozen" || item.status === "Requested")}
                                />
                                <label><strong>For Sale</strong></label>
                            </div>
                        }
                        {/* Publish or unpublish button: */}
                        <button
                            className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:cursor-not-allowed disabled:bg-gray-500"
                            onClick={handlePublishClick}
                            disabled={bids.length > 0 || item.status === "Frozen" || item.status === "Requested"}
                        >
                            {published ? "Unpublish" : "Publish"}
                        </button>
                        {!published &&
                            <button className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:cursor-not-allowed disabled:bg-gray-500"
                                onClick={handleRemoveClick} disabled={(item.status === "Frozen" || item.status === "Requested")}>Remove Item</button>}

                        {/* archive item */}
                        {!archived && !published && (
                            <button
                                className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:cursor-not-allowed disabled:bg-gray-500"
                                onClick={handleArchiveClick}
                                disabled={(item.status === "Frozen" || item.status === "Requested")}
                            >
                                Archive
                            </button>
                        )}
                    
                        {!!errorMessage && <p className="text-sm">{errorMessage}</p>}
                    </div>
                </>
            ) : (
                <p>Loading...</p>
            ))}
        </div>
    );
}
