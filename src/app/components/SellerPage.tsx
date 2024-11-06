import React, { useState, useEffect} from 'react';
import Image from 'next/image';
import { Link } from 'react-router-dom';
import { ItemStatus } from '../../utils/ItemStatus'
    
interface SellerPageProps {
    userData: {username:string,accountType:string,isActive:number,balance:number}
    logout: () => void;
}

export default function SellerPage(props: SellerPageProps) {

    /*get JSON of seller id from database*/
    const [selectedOption, setSelectedOption] = useState("All");
    const [filteredItemresult, setFilteredItemresult] = useState<any[]>([]);
    const [sellerResult, setSellerResult] = useState<any[]>([]);

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedOption(event.target.value);
    };

    useEffect(() => {
        const fetchData = async () => {
          const payload = {
            username: props.userData.username,
            status: selectedOption,
          };
          try {
            const response = await fetch('https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/getSellerItems',
              {
                method: 'POST',
                body: JSON.stringify(payload),
              });
    
            const resultData = await response.json();
            if (resultData.statusCode == 200) {
                setFilteredItemresult(resultData.items);
            }
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        }
        fetchData();
      }, [selectedOption]);

    const handleScroll = (event: React.WheelEvent<HTMLDivElement>) => {
        const container = event.target as HTMLDivElement;
        const scrollAmount = event.deltaY;
        container.scrollTo({
            top: 0,
            left: container.scrollLeft + scrollAmount,
            behavior: 'smooth'
        });
    };

    /**
     * Used to call `logout()`
     * @param event The event object.
     */
    const handleLogout = () => {
        props.logout();
    };

    return (
        <div className='content'>
             {/* need to handle account active/closed */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center"}}> {/* heading of seller */}
                <Image src="/accountSymbol.png" alt="Seller Account Symbol" width={100} height={100} style={{ objectFit: "contain", margin: "1rem"}} />
                <b>{props.userData!.username}</b>
            </div>
            <div className="sellerContent"> {/* item content */}
                <div className='sellerContentColumn' style={{ width: "25%", }}>
                    <p><b>Profit:</b></p>
                    ${props.userData!.balance}
                    <div className='buttons'>
                        {/* on clicks */}
                        <button className='accountButton'>Close Account</button>
                        <button className='accountButton' onClick={handleLogout}>Log out</button>
                    </div>
                </div>
                <div className='sellerContentColumn' style={{ width: "60%", }}>
                    <div className='flex row' style={{ justifyContent: "space-between", alignItems: "center" }}>
                        <p><b>Items:</b></p>
                        <select value={selectedOption} onChange={handleSelectChange}>
                            <option value={"All"}>All</option>
                            <option value={"Active"}>Active</option>
                            <option value={"Inactive"}>Inactive</option>
                            <option value={"Frozen"}>Frozen</option>
                            <option value={"Requested"}>Requested</option>
                            <option value={"Failed"}>Failed</option>
                            <option value={"Archived"}>Archived</option>
                            <option value={"Completed"}>Completed</option>
                            <option value={"Fulfilled"}>Fulfilled</option>
                        </select>
                    </div>
                    <div className='flex row'>
                        {/* Get items based on filter, not sold prob?? */}
                        <div className="container" onWheel={handleScroll}>
                        {filteredItemresult.length > 0 ? (
                            filteredItemresult.map((item, index) => (
                            <div key={index} className="item">
                                <h3>{item.image} </h3>
                                <h3>{item.name}</h3>
                                <p> Description: {item.description} </p>
                                <p> Start Date: {item.startDate} </p>
                                <p> End Date: {item.endDate} </p>
                                <p> ${item.price} </p>
                            </div>
                            ))
                        ) : (
                            <p>No items found.</p>
                        )}
                        </div>
                    </div>
                    {/*
                    <div className="container" onWheel={handleScroll}>
                        {/* Get sold Items }
                            {Array.from({ length: 10 }, (_, index) => (
                            <div className="scrollItem" key={index}>
                            {index + 1}
                            </div>
                        ))}
                    </div>
                    */}
                </div>
                <div className='sellerContentColumn' style={{ width: "6%", justifyContent: "center", alignItems: "center"}}>
                    <Link to="/addItem"><button style={{ fontSize: "5vw", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <b>+</b>
                    </button></Link>
                </div>
            </div>
        </div>
    );
}