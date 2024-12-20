'use client';
import type { AccountType } from '@/utils/types';
import Image from 'next/image';
import { useEffect, useState } from "react";
import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AccountPage, AddItemPage, HomePage, LoginPage, RecentlySold, RegisterPage, SearchBar, SortDropdown } from './components/';
import {ForensicsReport } from './components/AdminPages';
import { EditItemPage, ItemPage } from './components/ItemPage';

function AppContent() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("startDate_ASC");
  const [recentlySold, setRecentlySold] = useState(false);

  // Called whenever token changes
  useEffect(() => {
    const verifyToken = async () => {
      if (token === undefined || token === null) {
        logout();
        return;
      }

      try {
        const response = await fetch("https://bgsfn1wls6.execute-api.us-east-1.amazonaws.com/initial/verifyToken", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        setIsLoggedIn(data.body?.username && data.body?.accountType);
        setAccountType(data.body?.accountType ?? null);
      } catch (error) {
        console.error("Failure to verify token: " + error);
        setIsLoggedIn(false);
        setAccountType(null);
      }
    }
    verifyToken();
  }, [token]);

  function onLogin(newToken: string, accountType: AccountType): void {
    setToken(newToken);
    setAccountType(accountType);
    localStorage.setItem('token', newToken); //Store token in localStorage
  }

  function onRegister(newToken: string, accountType: AccountType): void {
    setToken(newToken);
    setAccountType(accountType);
    localStorage.setItem('token', newToken); //Store token in localStorage
  }


  /**
   * Logs the user out by deleting their token from local storage and changing the React states.
   * 
   * Redirects user to `/`.
   */
  function logout(): void {
    // Remove the token from local storage
    localStorage.removeItem("token");

    setToken(null);
    setIsLoggedIn(false);
    setAccountType(null);
  }

  // #region TSX
  return (
    <main className="main-container">
      <div className="heading">
        {accountType !== "Seller" &&
          <>
            <Link to="/">
              <button className="HomeButton" style={{ height: "100%", display: "flex", alignItems: "center" }}
                onClick={() => {
                  setRecentlySold(false);
                  setSearchInput(""); // Reset the search input
                }}>Auction House</button>
            </Link>
            <div className="search">
              <SearchBar setSearchInput={setSearchInput} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                {accountType === "Buyer" && (
                  <RecentlySold setRecentlySold={setRecentlySold} recentlySold={recentlySold} />
                )}
                <SortDropdown setSortBy={setSortBy} />
              </div>
            </div>
          </>
        }
        {accountType === "Seller" &&
          <Link to="/"><button className="HomeButton h-full flex items-center" onClick={() => logout()}>Logout</button></Link>
        }
        <Link to={isLoggedIn ? "/account" : "/login"}>
          <button className="AccountButton" style={{ height: "100%", display: "flex", alignItems: "center" }} onClick={() => setRecentlySold(false)}>
            <Image src="/accountSymbol.png" height={40} width={40} alt="Account" />
          </button>
        </Link>
      </div>
      <div className="content">
        <Routes>
          <Route path="/" element={accountType !== "Seller" ? <HomePage searchInput={searchInput} sortBy={sortBy} recentlySold={accountType === "Buyer" && recentlySold} /> : <Navigate to={"/account"} />} />
          <Route path="/addItem" element={isLoggedIn && token ? <AddItemPage /> : <Navigate to="/account" />} />
          <Route path="/login" element={!isLoggedIn ? <LoginPage onLogin={onLogin} /> : <Navigate to="/account" />} />
          <Route path="/createAccount" element={!isLoggedIn ? <RegisterPage onRegister={onRegister} /> : <Navigate to="/account" />} />
          <Route path="/account" element={isLoggedIn ? <AccountPage accountType={accountType} logout={logout} /> : <Navigate to="/" />} />
          <Route path="/item/:id" element={<ItemPage accountType={accountType} token={token} />} />
          <Route path="/edit/:id" element={isLoggedIn && accountType === "Seller" ? <EditItemPage accountType={accountType} token={token} /> : <Navigate to="/" />} />
          <Route path="/forensicsReport" element={isLoggedIn && accountType === "Admin" ? <ForensicsReport /> : <Navigate to="/account" />} />
        </Routes>
      </div>
    </main>
  );
  // #endregion
}
export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <HashRouter basename='/'>
      <AppContent />
    </HashRouter>
  );
}
