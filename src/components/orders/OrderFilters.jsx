import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";

export default function OrderFilters({ filters, onFilterChange, onReset }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Filters</span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search orders, customers..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>

        <Select 
          value={filters.status} 
          onValueChange={(value) => onFilterChange('status', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="hold">On Hold</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.priority} 
          onValueChange={(value) => onFilterChange('priority', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="rush">Rush</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.source} 
          onValueChange={(value) => onFilterChange('source', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="magento">Magento</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={onReset}
          className="text-slate-500 hover:text-slate-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}