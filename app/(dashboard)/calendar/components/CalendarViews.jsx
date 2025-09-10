"use client";

import Calendar from 'react-calendar';
import { format, isToday, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarTileContent } from './CalendarTileContent';

/**
 * Month View Component
 */
export const MonthView = ({ 
  date, 
  setDate, 
  campaigns, 
  stores, 
  handleCampaignClick,
  getCampaignsForDate,
  handleDayClick,
  selectedForComparison,
  handleComparisonToggle
}) => {
  const tileClassName = ({ date: tileDate }) => {
    const dayHasCampaigns = getCampaignsForDate(tileDate).length > 0;
    const isCurrentDay = isToday(tileDate);
    const isFutureDay = isFuture(tileDate);
    
    // Debug far future dates
    if (tileDate.getFullYear() >= 2025 && tileDate.getMonth() >= 9) {
      const campaigns = getCampaignsForDate(tileDate);
      if (campaigns.length > 0) {
        console.log(`Found ${campaigns.length} campaigns for ${tileDate.toDateString()}:`, campaigns);
      }
    }
    
    return cn(
      'relative',
      dayHasCampaigns && 'has-campaigns',
      isCurrentDay && 'bg-gradient-to-br from-sky-tint to-lilac-mist border-2 border-sky-blue',
      // Removed gray text for future days to make campaign cards more visible
      // isFutureDay && 'text-gray-400'
    );
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateCampaigns = getCampaignsForDate(date);
      return (
        <CalendarTileContent
          campaigns={dateCampaigns}
          stores={stores}
          handleCampaignClick={handleCampaignClick}
          maxCampaignsToShow={2}
          selectedForComparison={selectedForComparison}
          handleComparisonToggle={handleComparisonToggle}
        />
      );
    }
    return null;
  };

  return (
    <div className="calendar-container">
      <Calendar
        onChange={setDate}
        value={date}
        tileClassName={tileClassName}
        tileContent={tileContent}
        onClickDay={handleDayClick}
        className="w-full border-0"
      />
    </div>
  );
};

/**
 * Week View Component  
 */
export const WeekView = ({ 
  date, 
  campaigns, 
  stores, 
  handleCampaignClick,
  getCampaignsForDate,
  handleDayClick,
  selectedForComparison,
  handleComparisonToggle
}) => {
  // Calculate week dates
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  return (
    <div className="grid grid-cols-7 gap-2 h-[600px]">
      {weekDays.map((day, index) => {
        const dayCampaigns = getCampaignsForDate(day);
        const isCurrentDay = isToday(day);
        
        return (
          <div
            key={index}
            className={cn(
              "border rounded-lg p-2 overflow-y-auto cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
              isCurrentDay && "bg-gradient-to-br from-sky-tint to-lilac-mist border-2 border-sky-blue",
              "dark:border-gray-700"
            )}
            onClick={() => handleDayClick(day)}
          >
            <div className="font-semibold text-sm mb-2 text-center">
              {format(day, 'EEE')}
              <div className="text-lg">{format(day, 'd')}</div>
            </div>
            
            <CalendarTileContent
              campaigns={dayCampaigns}
              stores={stores}
              handleCampaignClick={handleCampaignClick}
              maxCampaignsToShow={5}
              selectedForComparison={selectedForComparison}
              handleComparisonToggle={handleComparisonToggle}
            />
          </div>
        );
      })}
    </div>
  );
};

/**
 * Day View Component
 */
export const DayView = ({ 
  date, 
  campaigns, 
  stores, 
  handleCampaignClick,
  getCampaignsForDate,
  selectedForComparison,
  handleComparisonToggle
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayCampaigns = getCampaignsForDate(date);
  
  // Group campaigns by hour
  const campaignsByHour = {};
  dayCampaigns.forEach(campaign => {
    const hour = new Date(campaign.date).getHours();
    if (!campaignsByHour[hour]) {
      campaignsByHour[hour] = [];
    }
    campaignsByHour[hour].push(campaign);
  });

  return (
    <div className="h-[600px] overflow-y-auto">
      <div className="min-h-full">
        {hours.map(hour => {
          const hourCampaigns = campaignsByHour[hour] || [];
          const hourLabel = format(new Date().setHours(hour, 0, 0, 0), 'h a');
          
          return (
            <div
              key={hour}
              className="flex border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="w-20 p-2 text-xs text-gray-500 font-medium text-right border-r dark:border-gray-700">
                {hourLabel}
              </div>
              <div className="flex-1 min-h-[60px] p-2">
                <CalendarTileContent
                  campaigns={hourCampaigns}
                  stores={stores}
                  handleCampaignClick={handleCampaignClick}
                  maxCampaignsToShow={10}
                  selectedForComparison={selectedForComparison}
                  handleComparisonToggle={handleComparisonToggle}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};