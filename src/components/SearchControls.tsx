import React from 'react';

interface SearchControlsProps {
  searchRadius: number;
  onRadiusChange: (radius: number) => void;
  showHistoricalSpots: boolean;
  showFoodBeverageSpots: boolean;
  onHistoricalSpotsToggle: (show: boolean) => void;
  onFoodBeverageSpotsToggle: (show: boolean) => void;
  historicalSpotsCount: number;
  foodBeverageSpotsCount: number;
}

const SearchControls: React.FC<SearchControlsProps> = ({
  searchRadius,
  onRadiusChange,
  showHistoricalSpots,
  showFoodBeverageSpots,
  onHistoricalSpotsToggle,
  onFoodBeverageSpotsToggle,
  historicalSpotsCount,
  foodBeverageSpotsCount
}) => {
  return (
    <div className="search-controls">
      <div className="radius-control">
        <label htmlFor="search-radius">Search Radius:</label>
        <select 
          id="search-radius"
          value={searchRadius} 
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="radius-select"
        >
          <option value={250}>250m</option>
          <option value={500}>500m</option>
          <option value={750}>750m</option>
          <option value={1000}>1km</option>
          <option value={1500}>1.5km</option>
          <option value={2000}>2km</option>
        </select>
      </div>
      
      <div className="spot-type-controls">
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showHistoricalSpots}
              onChange={(e) => onHistoricalSpotsToggle(e.target.checked)}
              className="spot-checkbox"
            />
            <span className="checkbox-text">
              🏛️ Tourism Attractions ({historicalSpotsCount})
            </span>
          </label>
        </div>
        
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showFoodBeverageSpots}
              onChange={(e) => onFoodBeverageSpotsToggle(e.target.checked)}
              className="spot-checkbox"
            />
            <span className="checkbox-text">
              🍽️ Food & Beverage ({foodBeverageSpotsCount})
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default SearchControls; 