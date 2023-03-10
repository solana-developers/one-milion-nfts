import React from "react";
import "./spinner.css";

export default function LoadingSpinner() {
  return (
    <div className="w-full h-full flex justify-center items-center backdrop-brightness-50">
      <div className="loading-spinner"></div>
    </div>
  );
}