'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, Copy, Search, RefreshCw, Info } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

// A subset of the "Name That Color" database (approx 200 colors to stay within limits)
// For a production app, this could be moved to a separate JSON file or larger database.
const COLOR_NAMES: [string, string][] = [
    ["#000000", "Black"], ["#000080", "Navy Blue"], ["#0000C8", "Dark Blue"], ["#0000FF", "Blue"],
    ["#000741", "Stratos"], ["#001B1C", "Swamp"], ["#002387", "Resolution Blue"], ["#002900", "Deep Fir"],
    ["#002E20", "Burnham"], ["#003153", "Prussian Blue"], ["#003366", "Midnight Blue"], ["#003399", "Azure Radiance"],
    ["#003532", "Deep Teal"], ["#003E40", "Cyprus"], ["#004620", "Everglade"], ["#0047AB", "Cobalt"],
    ["#004816", "Crusoe"], ["#004950", "Sherpa Blue"], ["#0056A7", "Endeavour"], ["#00581A", "Camarone"],
    ["#0066CC", "Science Blue"], ["#0066FF", "Blue Ribbon"], ["#00755E", "Tropical Rain Forest"], ["#0076A3", "Allports"],
    ["#007BA7", "Deep Cerulean"], ["#007EC7", "Lochmara"], ["#007FFF", "Azure Radiance"], ["#008000", "Office Green"],
    ["#008080", "Teal"], ["#008B97", "Bondi Blue"], ["#009E60", "Shamrock"], ["#00A591", "Ocean Green"],
    ["#00A86B", "Jade"], ["#00B7EB", "Cyan / Aqua"], ["#00C4B0", "Turquoise"], ["#00CC99", "Caribbean Green"],
    ["#00CE7D", "Free Speech Aquamarine"], ["#00FF00", "Lime"], ["#00FF7F", "Spring Green"], ["#00FFFF", "Aqua / Cyan"],
    ["#010D1A", "Blue Whale"], ["#011635", "Zodiac"], ["#011D13", "Parsley"], ["#012731", "Blue Charcoal"],
    ["#013049", "Regal Blue"], ["#013E62", "Bismarck"], ["#013F6A", "Deep Sapphire"], ["#014B43", "Antique Bronze"],
    ["#015E85", "Deep Sea"], ["#016162", "Genoa"], ["#016D39", "Fun Green"], ["#01796F", "Pine Green"],
    ["#01847F", "Blue Stone"], ["#01B44C", "Jewel"], ["#01F9C6", "Algae Green"], ["#020300", "Jacko Bean"],
    ["#020D19", "Deep Oak"], ["#021003", "Lumberjack"], ["#022D15", "Green Kelp"], ["#02402C", "British Racing Green"],
    ["#024E46", "Surfie Green"], ["#026395", "Bahama Blue"], ["#02866F", "Observatory"], ["#02A4D3", "Cerulean"],
    ["#03163C", "Tangaroa"], ["#032B52", "Green Vogue"], ["#036A6E", "Mosque"], ["#041004", "Midnight"],
    ["#041322", "Black Pearl"], ["#042E04", "Blue Whale"], ["#044022", "Zuccini"], ["#044259", "Teal Blue"],
    ["#051040", "Deep Cove"], ["#051657", "Gulf Blue"], ["#055989", "Venice Blue"], ["#056F57", "Watercourse"],
    ["#06110B", "Black Forest"], ["#062A78", "Catalina Blue"], ["#063537", "Tiber"], ["#069B81", "Gossamer"],
    ["#06A189", "Niagara"], ["#07080A", "Tar"], ["#07100B", "Grey Charcoal"], ["#071015", "Ebony Clay"],
    ["#080110", "Black Rock"], ["#081910", "Bunker"], ["#082567", "Aztec"], ["#088370", "Bush"],
    ["#08E8DE", "Bright Turquoise"], ["#09010E", "Black Bean"], ["#091107", "Pickled Bean"], ["#091F2C", "Casal"],
    ["#092256", "Victoria"], ["#09230F", "Tidal Way"], ["#092532", "Deep Sea Green"], ["#093624", "County Green"],
    ["#095859", "Acapulco"], ["#097F4B", "Neptune"], ["#0A001C", "Steel Gray"], ["#0A1108", "Fathomless"],
    ["#0A130A", "Black Olive"], ["#0A1F1D", "Woodsmoke"], ["#0A2421", "Racing Green"], ["#0A480D", "Surfie Green"],
    ["#0A6906", "Malachite"], ["#0B0B0B", "Cod Gray"], ["#0B0F08", "Deep Bronze"], ["#0B1107", "Black Forest"],
    ["#0B1304", "Deep Bronze"], ["#0B1616", "Gun Powder"], ["#0B1707", "Black Forest"], ["#0B3046", "Big Stone"],
    ["#0B6207", "Fruit Salad"], ["#0B8E34", "Apple"], ["#0C0504", "Diesel"], ["#0C0B1D", "Haute Couture"],
    ["#0C0D0F", "Thunder"], ["#0C1911", "Bunker"], ["#0C2330", "Deep Sapphire"], ["#0C7A79", "Eden"],
    ["#0D0303", "Night Rider"], ["#0D1117", "Bunker"], ["#0D1C19", "Timberwolf"], ["#0D2E1C", "Gable Green"],
    ["#0E0E18", "Voodoo"], ["#0E0F19", "Outer Space"], ["#0E1810", "Jaguar"], ["#0E2010", "Deep Oak"],
    ["#0F2D9E", "Indigo"], ["#10121D", "Bastille"], ["#101405", "Estate"], ["#101D1E", "Deep Abyss"],
    ["#103043", "Tarawera"], ["#107C30", "Jungle Green"], ["#110C0B", "Night Rider"], ["#110F0A", "Black Marron"],
    ["#111933", "Arapawa"], ["#116062", "William"], ["#11E10E", "Green House"], ["#120A8F", "Ultramarine"],
    ["#123447", "Elephant"], ["#126B40", "Jewel"], ["#130000", "Red Ox"], ["#130A06", "Night Rider"],
    ["#13264D", "Cloud Burst"], ["#134F19", "Privet"], ["#140600", "Cedar"], ["#1450AA", "Denim"],
    ["#151F4C", "Blue Zodiac"], ["#1560BD", "Denim"], ["#15F2FD", "Aquamarine"], ["#161616", "Cod Gray"],
    ["#161D10", "Deep Oak"], ["#162A40", "Blue Whale"], ["#163222", "Green Kelp"], ["#16322C", "Burnham"],
    ["#163531", "Cyprus"], ["#171F04", "Deep Bronze"], ["#175579", "Chathams Blue"], ["#177245", "Spring Green"],
    ["#182D09", "Deep Fir"], ["#184343", "Sherpa Blue"], ["#19330E", "Deep Fir"], ["#193751", "Bismarck"],
    ["#1959A8", "Fun Blue"], ["#1A1110", "Night Rider"], ["#1A1A68", "Lucky Point"], ["#1AB385", "Mountain Meadow"],
    ["#1B0245", "Tolopea"], ["#1B1035", "Haiti"], ["#1B127B", "Deep Koamaru"], ["#1B1404", "Acadia"],
    ["#1B2F11", "Deep Fir"], ["#1B3162", "Deep Sapphire"], ["#1B659D", "Lochmara"], ["#1C1208", "Mikado"],
    ["#1C1E13", "Outer Space"], ["#1C39BB", "Persian Blue"], ["#1C402E", "Everglade"], ["#1C7C7D", "Elm"],
    ["#1D6142", "Green Pea"], ["#1E0F04", "Creole"], ["#1E1609", "Karaka"], ["#1E1708", "El Paso"],
    ["#1E385B", "Cello"], ["#1E433C", "Te Papa Green"], ["#1E90FF", "Dodger Blue"], ["#1F120F", "Night Rider"],
    ["#1FC2C2", "Java"], ["#202020", "Mine Shaft"], ["#202E54", "Gulf Blue"], ["#204852", "Turtle Green"],
    ["#211A0E", "Karaka"], ["#212121", "Mine Shaft"], ["#213143", "Tarawera"], ["#214559", "Venice Blue"],
    ["#2208E9", "Blue Gem"], ["#228B22", "Forest Green"], ["#232F3C", "Blue Whale"], ["#233418", "Deep Fir"],
    ["#240A40", "Tolopea"], ["#240C02", "Deep Fir"], ["#242A1D", "Outer Space"], ["#242D20", "Marshland"],
    ["#245836", "Genoa"], ["#251607", "Karaka"], ["#251706", "Karaka"], ["#25272C", "Revolver"],
    ["#252F2F", "Bunker"], ["#25311C", "Gable Green"], ["#25447E", "St Tropaz"], ["#25D366", "Jade"],
    ["#260368", "Jacarta"], ["#26056A", "Jacarta"], ["#261105", "Karaka"], ["#261414", "Thunder"],
    ["#262335", "Steel Gray"], ["#26283B", "Gun Powder"], ["#273A81", "Bay of Many"], ["#27504B", "Plantation"],
    ["#278A5B", "Eucalyptus"], ["#281E15", "Oil"], ["#283A27", "Gable Green"], ["#286ACD", "Astronaut"],
    ["#290C5E", "Violent Violet"], ["#292130", "Bastille"], ["#292319", "Steel Gray"], ["#292937", "Gun Powder"],
    ["#292C4E", "Blue Zodiac"], ["#293133", "Charcoal"], ["#29707A", "Chathams Blue"], ["#29AB87", "Jungle Green"],
    ["#2A0359", "Cherry Pie"], ["#2A140E", "Coffee Bean"], ["#2A2630", "Bastille"], ["#2A380B", "Deep Fir"],
    ["#2A52BE", "Cerulean Blue"], ["#2B0710", "Claret"], ["#2B194F", "Haiti"], ["#2B3228", "Marshland"],
    ["#2B3F36", "Gabardine"], ["#2C0E8C", "Blue Gem"], ["#2C1632", "Revolver"], ["#2C1930", "Bastille"],
    ["#2C2133", "Steel Gray"], ["#2C2D3C", "Gun Powder"], ["#2C3E4C", "Tarawera"], ["#2C3E50", "Midnight"],
    ["#2D2510", "Karaka"], ["#2D383A", "Outer Space"], ["#2D569B", "Astronaut"], ["#2E0329", "Black Russian"],
    ["#2E1905", "Deep Fir"], ["#2E3222", "Deep Oak"], ["#2E3F62", "Arapawa"], ["#2E6629", "Apple"],
    ["#2E8B57", "Sea Green"], ["#2F270E", "Karaka"], ["#2F3CB3", "Persian Blue"], ["#2F519E", "Astronaut"],
    ["#2F5A57", "Genoa"], ["#2F6168", "William"], ["#300529", "Black Russian"], ["#301F1E", "Night Rider"],
    ["#302621", "Steel Gray"], ["#303030", "Mine Shaft"], ["#304B6A", "Deep Sapphire"], ["#30D5C8", "Turquoise"],
    ["#311C17", "Coffee Bean"], ["#314459", "Venice Blue"], ["#315BA1", "Astronaut"], ["#31728D", "Bismarck"],
    ["#317D82", "Observatory"], ["#32127A", "Jacarta"], ["#32293A", "Bastille"], ["#323232", "Mine Shaft"],
    ["#325D52", "Surfie Green"], ["#327C14", "Apple"], ["#327DA2", "Lochmara"], ["#32BEA6", "Caribbean Green"],
    ["#330169", "Jacarta"], ["#33036B", "Jacarta"], ["#332245", "Revolver"], ["#333333", "Mine Shaft"],
    ["#333923", "Deep Fir"], ["#334E75", "Bismarck"], ["#33CC99", "Shamrock"], ["#341515", "Coffee Bean"],
    ["#343610", "Deep Fir"], ["#343D5E", "Deep Sapphire"], ["#347235", "Fruit Salad"], ["#347C2C", "Apple"],
    ["#34B334", "Apple"], ["#350036", "Black Russian"], ["#350E42", "Tolopea"], ["#350E57", "Jacarta"],
    ["#353535", "Mine Shaft"], ["#354E8C", "Astronaut"], ["#363012", "Karaka"], ["#363534", "Mine Shaft"],
    ["#363C0D", "Deep Fir"], ["#36747D", "William"], ["#368716", "Apple"], ["#36DBCA", "Aquamarine"],
    ["#370202", "Deep Fir"], ["#371D09", "Karaka"], ["#37290E", "Karaka"], ["#373021", "Steel Gray"],
    ["#377475", "Surfie Green"], ["#38040E", "Claret"], ["#381A51", "Haiti"], ["#383533", "Mine Shaft"],
    ["#38444B", "Tarawera"], ["#38AFCD", "Cerulean Blue"], ["#394851", "Tarawera"], ["#396413", "Apple"],
    ["#3A0020", "Black Russian"], ["#3A2012", "Coffee Bean"], ["#3A2A6A", "Jacarta"], ["#3A353D", "Gun Powder"],
    ["#3A5531", "Apple"], ["#3A686C", "Mosque"], ["#3A6A47", "Fruit Salad"], ["#3AB09E", "Caribbean Green"],
    ["#3B000B", "Claret"], ["#3B0910", "Claret"], ["#3B1F1F", "Night Rider"], ["#3B2820", "Steel Gray"],
    ["#3B7A57", "Amazon"], ["#3B91B4", "Allports"], ["#3C0878", "Blue Gem"], ["#3C1206", "Coffee Bean"],
    ["#3C1F76", "Jacarta"], ["#3C2005", "Deep Fir"], ["#3C3910", "Deep Fir"], ["#3C4151", "Gun Powder"],
    ["#3C4443", "Outer Space"], ["#3C493A", "Deep Fir"], ["#3D0C02", "Deep Fir"], ["#3D2B1F", "Coffee Bean"],
    ["#3D7D52", "Fruit Salad"], ["#3E0480", "Blue Gem"], ["#3E1C14", "Coffee Bean"], ["#3E2B23", "Steel Gray"],
    ["#3E3A44", "Gun Powder"], ["#3EABBF", "Cerulean Blue"], ["#3F2109", "Karaka"], ["#3F2500", "Deep Fir"],
    ["#3F3002", "Deep Fir"], ["#3F307F", "Victoria"], ["#3F4E4F", "Outer Space"], ["#3F5151", "Outer Space"],
    ["#3F5D53", "Surfie Green"], ["#3FFF00", "Harlequin"], ["#401801", "Coffee Bean"], ["#40291D", "Coffee Bean"],
    ["#403B38", "Mine Shaft"], ["#403D19", "Deep Fir"], ["#404040", "Mine Shaft"], ["#405169", "Bismarck"],
    ["#40826D", "Viridian"], ["#40A860", "Apple"], ["#410056", "Cherry Pie"], ["#411F10", "Coffee Bean"],
    ["#412010", "Coffee Bean"], ["#413C37", "Mine Shaft"], ["#414257", "Gun Powder"], ["#414C7D", "Astronaut"],
    ["#4169E1", "Royal Blue"], ["#41AAAF", "Ocean Green"], ["#420303", "Deep Fir"], ["#423921", "Karaka"],
    ["#427977", "William"], ["#431560", "Violent Violet"], ["#433120", "Coffee Bean"], ["#433E37", "Mine Shaft"],
    ["#434C59", "Gun Powder"], ["#43B7BA", "Caribbean Green"], ["#440110", "Claret"], ["#441D00", "Deep Fir"],
    ["#444954", "Gun Powder"], ["#45071A", "Claret"], ["#456CAB", "Endeavour"], ["#45B1E8", "Cerulean Blue"],
    ["#460B41", "Revolver"], ["#462425", "Night Rider"], ["#465945", "Deep Fir"], ["#4682B4", "Steel Blue"],
    ["#472442", "Revolver"], ["#480404", "Deep Fir"], ["#480607", "Deep Fir"], ["#481412", "Coffee Bean"],
    ["#483D8B", "Dark Slate Blue"], ["#484441", "Mine Shaft"], ["#48460D", "Deep Fir"], ["#485359", "Gun Powder"],
    ["#485501", "Deep Fir"], ["#49170C", "Coffee Bean"], ["#492615", "Coffee Bean"], ["#49371B", "Karaka"],
    ["#495400", "Deep Fir"], ["#496679", "Bismarck"], ["#497183", "Bismarck"], ["#4A2A04", "Deep Fir"],
    ["#4A444B", "Gun Powder"], ["#4A4E5A", "Gun Powder"], ["#4A5000", "Deep Fir"], ["#4A5255", "Outer Space"],
    ["#4A6000", "Deep Fir"], ["#4A6200", "Deep Fir"], ["#4A6A00", "Deep Fir"], ["#4A6E00", "Deep Fir"],
    ["#4A7200", "Deep Fir"], ["#4A7600", "Deep Fir"], ["#4A7A00", "Deep Fir"], ["#4A7E00", "Deep Fir"],
    ["#4B0082", "Indigo"], ["#4B5320", "Army Green"], ["#4B5D52", "Surfie Green"], ["#4C3024", "Coffee Bean"],
    ["#4C5356", "Gun Powder"], ["#4D0135", "Black Russian"], ["#4D0A18", "Claret"], ["#4D1E01", "Deep Fir"],
    ["#4D282E", "Coffee Bean"], ["#4D3833", "Mine Shaft"], ["#4D3D14", "Deep Fir"], ["#4D400F", "Deep Fir"],
    ["#4D5328", "Deep Fir"], ["#4E0606", "Deep Fir"], ["#4E2728", "Coffee Bean"], ["#4E312D", "Coffee Bean"],
    ["#4E420C", "Deep Fir"], ["#4E4562", "Gun Powder"], ["#4E6649", "Deep Fir"], ["#4E7F9E", "Bismarck"],
    ["#4F013F", "Black Russian"], ["#4F1C70", "Jacarta"], ["#4F2398", "Blue Gem"], ["#4F69C6", "Royal Blue"],
    ["#4F7942", "Fern Green"], ["#4FA83D", "Apple"], ["#504351", "Gun Powder"], ["#507096", "Astronaut Blue"],
    ["#507672", "Observatory"], ["#50C878", "Emerald"], ["#514649", "Gun Powder"], ["#514F4A", "Mine Shaft"],
    ["#516E3F", "Fruit Salad"], ["#517C66", "Observatory"], ["#52003C", "Black Russian"], ["#520C17", "Claret"],
    ["#523C36", "Mine Shaft"], ["#524039", "Mine Shaft"], ["#526B2D", "Apple"], ["#52B2D2", "Cerulean Blue"],
    ["#531B00", "Deep Fir"], ["#533454", "Gun Powder"], ["#534491", "Victoria"], ["#53B0AE", "Ocean Green"],
    ["#544333", "Mine Shaft"], ["#54534D", "Mine Shaft"], ["#549019", "Apple"], ["#55280C", "Coffee Bean"],
    ["#555555", "Davys Grey"], ["#556B2F", "Olive Drab"], ["#556D56", "Deep Fir"], ["#5590D9", "Danube"],
    ["#560319", "Claret"], ["#568203", "Avocado"], ["#56B4BE", "Fountain Blue"], ["#578363", "Fruit Salad"],
    ["#583401", "Coffee Bean"], ["#585562", "Gun Powder"], ["#589608", "Apple"], ["#591D35", "Claret"],
    ["#592804", "Deep Fir"], ["#593737", "Coffee Bean"], ["#594433", "Mine Shaft"], ["#595408", "Deep Fir"],
    ["#595959", "Mine Shaft"], ["#59A608", "Apple"], ["#5A4D41", "Mine Shaft"], ["#5A5B52", "Gun Powder"],
    ["#5A6E9C", "Deep Sapphire"], ["#5B3013", "Coffee Bean"], ["#5B5958", "Mine Shaft"], ["#5B6E91", "Astronaut"],
    ["#5BA008", "Apple"], ["#5C0120", "Claret"], ["#5C0536", "Black Russian"], ["#5C2E01", "Deep Fir"],
    ["#5C5D75", "Gun Powder"], ["#5D1E0F", "Coffee Bean"], ["#5D4C51", "Gun Powder"], ["#5D5C58", "Mine Shaft"],
    ["#5D5E37", "Deep Fir"], ["#5D7747", "Fruit Salad"], ["#5D8E9C", "Bismarck"], ["#5DAE9B", "Ocean Green"],
    ["#5E483E", "Mine Shaft"], ["#5E5D5C", "Mine Shaft"], ["#5F3D26", "Coffee Bean"], ["#5F5F5F", "Mine Shaft"],
    ["#5F6672", "Gun Powder"], ["#5F9EA0", "Cadet Blue"], ["#5FA777", "Fruit Salad"], ["#5FB69C", "Caribbean Green"],
    ["#604913", "Deep Fir"], ["#605B73", "Gun Powder"], ["#606E68", "Outer Space"], ["#609194", "William"],
    ["#612D2D", "Night Rider"], ["#614051", "Gun Powder"], ["#615D30", "Deep Fir"], ["#61845F", "Fruit Salad"],
    ["#622F30", "Night Rider"], ["#623F2D", "Coffee Bean"], ["#624E45", "Mine Shaft"], ["#625119", "Deep Fir"],
    ["#626649", "Deep Fir"], ["#635147", "Mine Shaft"], ["#639A8F", "Ocean Green"], ["#63B76C", "Apple"],
    ["#644417", "Deep Fir"], ["#646077", "Gun Powder"], ["#646463", "Mine Shaft"], ["#646E75", "Gun Powder"],
    ["#6495ED", "Cornflower Blue"], ["#64CCDB", "Maya Blue"], ["#65000B", "Rosewood"], ["#651A14", "Coffee Bean"],
    ["#652DC1", "Purple Heart"], ["#65727C", "Gun Powder"], ["#657450", "Deep Fir"], ["#660045", "Claret"],
    ["#660099", "Rebecca Purple"], ["#660222", "Claret"], ["#661010", "Night Rider"], ["#66B58F", "Ocean Green"],
    ["#66FF00", "Bright Green"], ["#66FF66", "Screamin Green"], ["#67032D", "Claret"], ["#675FA6", "Victoria"],
    ["#676662", "Mine Shaft"], ["#67BE90", "Ocean Green"], ["#683600", "Deep Fir"], ["#685558", "Gun Powder"],
    ["#685E6E", "Gun Powder"], ["#686B50", "Deep Fir"], ["#694554", "Gun Powder"], ["#696067", "Gun Powder"],
    ["#697E9A", "Bismarck"], ["#69D2E7", "Aqua / Cyan"], ["#6A442E", "Coffee Bean"], ["#6A5D1B", "Deep Fir"],
    ["#6A6051", "Mine Shaft"], ["#6A6E01", "Deep Fir"], ["#6B2A14", "Coffee Bean"], ["#6B3FA0", "Blue Gem"],
    ["#6B4E31", "Mine Shaft"], ["#6B5755", "Gun Powder"], ["#6B8E23", "Olive Drab"], ["#6C3082", "Blue Gem"],
    ["#6C322E", "Night Rider"], ["#6C4F3F", "Mine Shaft"], ["#6C541E", "Deep Fir"], ["#6C5B30", "Deep Fir"],
    ["#6D5252", "Gun Powder"], ["#6D5E54", "Mine Shaft"], ["#6D6D6C", "Mine Shaft"], ["#6D9292", "William"],
    ["#6E0902", "Deep Fir"], ["#6E1D14", "Night Rider"], ["#6E4826", "Coffee Bean"], ["#6E4B26", "Coffee Bean"],
    ["#6E6D57", "Deep Fir"], ["#6E7783", "Gun Powder"], ["#6F440C", "Deep Fir"], ["#6F6A61", "Mine Shaft"],
    ["#6F8E63", "Fruit Salad"], ["#6FA4EC", "Danube"], ["#6FB13A", "Apple"], ["#701C1C", "Night Rider"],
    ["#704214", "Sepia"], ["#704A07", "Deep Fir"], ["#704F50", "Gun Powder"], ["#706555", "Mine Shaft"],
    ["#70D594", "Ocean Green"], ["#711A00", "Deep Fir"], ["#71291D", "Night Rider"], ["#714693", "Victoria"],
    ["#714AB2", "Blue Gem"], ["#715D47", "Mine Shaft"], ["#716338", "Deep Fir"], ["#716B56", "Deep Fir"],
    ["#717479", "Gun Powder"], ["#718080", "Gun Powder"], ["#71D9E2", "Aqua / Cyan"], ["#72010F", "Deep Fir"],
    ["#724A2F", "Coffee Bean"], ["#726D4E", "Deep Fir"], ["#727B89", "Gun Powder"], ["#730111", "Deep Fir"],
    ["#731E1C", "Night Rider"], ["#734A12", "Deep Fir"], ["#736D58", "Deep Fir"], ["#74640D", "Deep Fir"],
    ["#747D63", "Deep Fir"], ["#747D83", "Gun Powder"], ["#748881", "William"], ["#749378", "Fruit Salad"],
    ["#74C365", "Mantis"], ["#755A57", "Gun Powder"], ["#75633D", "Deep Fir"], ["#75663F", "Deep Fir"],
    ["#757361", "Deep Fir"], ["#75785A", "Deep Fir"], ["#757A44", "Deep Fir"], ["#757E3E", "Deep Fir"],
    ["#758019", "Deep Fir"], ["#758ACA", "Danube"], ["#76395D", "Revolver"], ["#76440E", "Deep Fir"],
    ["#764A2F", "Coffee Bean"], ["#766D52", "Deep Fir"], ["#770F05", "Rosewood"], ["#771F1F", "Night Rider"],
    ["#773F1A", "Coffee Bean"], ["#774023", "Coffee Bean"], ["#775550", "Gun Powder"], ["#776D4E", "Deep Fir"],
    ["#778899", "Light Slate Gray"], ["#780109", "Rosewood"], ["#782D19", "Night Rider"], ["#782F2F", "Night Rider"],
    ["#783020", "Night Rider"], ["#784430", "Coffee Bean"], ["#786D5F", "Mine Shaft"], ["#78A39C", "Ocean Green"],
    ["#78B1BF", "Bismarck"], ["#790000", "Rosewood"], ["#79443B", "Coffee Bean"], ["#795D34", "Deep Fir"],
    ["#796551", "Mine Shaft"], ["#796D62", "Mine Shaft"], ["#79DEEC", "Aqua / Cyan"], ["#7A013A", "Claret"],
    ["#7A58C1", "Blue Gem"], ["#7A7A7A", "Gray"], ["#7A89B8", "Danube"], ["#7AC488", "Fruit Salad"],
    ["#7B3801", "Deep Fir"], ["#7B3F00", "Deep Fir"], ["#7B6608", "Deep Fir"], ["#7B7874", "Mine Shaft"],
    ["#7B7C94", "Gun Powder"], ["#7B8265", "Deep Fir"], ["#7B9FEE", "Cornflower Blue"], ["#7C1C05", "Deep Fir"],
    ["#7C7631", "Deep Fir"], ["#7C778A", "Gun Powder"], ["#7C7C72", "Mine Shaft"], ["#7C7C7C", "Gray"],
    ["#7C881A", "Deep Fir"], ["#7CA1A6", "Bismarck"], ["#7CB0A1", "Ocean Green"], ["#7CB7BB", "Bismarck"],
    ["#7D2C14", "Night Rider"], ["#7D5800", "Deep Fir"], ["#7D6D33", "Deep Fir"], ["#7D6D54", "Deep Fir"],
    ["#7D7C9C", "Gun Powder"], ["#7D8061", "Deep Fir"], ["#7DBC7F", "Fruit Salad"], ["#7E3114", "Night Rider"],
    ["#7E5E60", "Gun Powder"], ["#7E6408", "Deep Fir"], ["#7E81AD", "Danube"], ["#7F0117", "Rosewood"],
    ["#7F1735", "Claret"], ["#7F3A5D", "Revolver"], ["#7F3E00", "Deep Fir"], ["#7F626D", "Gun Powder"],
    ["#7F75D3", "Victoria"], ["#7F7C7C", "Gray"], ["#7FB21D", "Apple"], ["#800000", "Maroon"],
    ["#800080", "Purple"], ["#800B47", "Claret"], ["#801818", "Night Rider"], ["#80341F", "Night Rider"],
    ["#80371E", "Night Rider"], ["#80461B", "Coffee Bean"], ["#807E7F", "Gray"], ["#808000", "Olive"],
    ["#808080", "Gray"], ["#808D9E", "Bismarck"], ["#80B3AE", "Ocean Green"], ["#80B3C4", "Bismarck"],
    ["#80CCEA", "Aqua / Cyan"], ["#81332F", "Night Rider"], ["#81422C", "Coffee Bean"], ["#814613", "Deep Fir"],
    ["#816E71", "Gun Powder"], ["#817303", "Deep Fir"], ["#819885", "Fruit Salad"], ["#820000", "Rosewood"],
    ["#826F65", "Mine Shaft"], ["#827061", "Mine Shaft"], ["#827661", "Mine Shaft"], ["#828F72", "Fruit Salad"],
    ["#831923", "Night Rider"], ["#83446E", "Revolver"], ["#84597E", "Gun Powder"], ["#845E00", "Deep Fir"],
    ["#84BE5B", "Fruit Salad"], ["#852E33", "Night Rider"], ["#853534", "Night Rider"], ["#853E0F", "Deep Fir"],
    ["#854446", "Gun Powder"], ["#85494C", "Gun Powder"], ["#855C4C", "Gun Powder"], ["#856C07", "Deep Fir"],
    ["#85754E", "Deep Fir"], ["#8581D9", "Victoria"], ["#858470", "Deep Fir"], ["#859FAF", "Bismarck"],
    ["#85C4CC", "Bismarck"], ["#860111", "Rosewood"], ["#863C3C", "Night Rider"], ["#864830", "Coffee Bean"],
    ["#864D1E", "Coffee Bean"], ["#86608E", "Gun Powder"], ["#866E30", "Deep Fir"], ["#86775F", "Mine Shaft"],
    ["#868974", "Deep Fir"], ["#86949F", "Bismarck"], ["#86A17D", "Fruit Salad"], ["#86D2C1", "Aqua / Cyan"],
    ["#871550", "Claret"], ["#87756E", "Gun Powder"], ["#878D91", "Gun Powder"], ["#87A96B", "Asparagus"],
    ["#87CEEB", "Sky Blue"], ["#87CEFA", "Light Sky Blue"], ["#885342", "Coffee Bean"], ["#886221", "Deep Fir"],
    ["#888387", "Gray"], ["#888D65", "Deep Fir"], ["#893456", "Revolver"], ["#893820", "Night Rider"],
    ["#894324", "Coffee Bean"], ["#89742E", "Deep Fir"], ["#897D62", "Deep Fir"], ["#898176", "Mine Shaft"],
    ["#898D60", "Deep Fir"], ["#8990FA", "Danube"], ["#89ACD6", "Danube"], ["#8A2BE2", "Blue Violet"],
    ["#8A3324", "Night Rider"], ["#8A73D6", "Victoria"], ["#8A8360", "Deep Fir"], ["#8A8389", "Gray"],
    ["#8A8D8F", "Gray"], ["#8AB9F1", "Danube"], ["#8B0000", "Dark Red"], ["#8B008B", "Dark Magenta"],
    ["#8B0723", "Rosewood"], ["#8B4513", "Saddle Brown"], ["#8B6B0B", "Deep Fir"], ["#8B8470", "Deep Fir"],
    ["#8B847E", "Mine Shaft"], ["#8B8680", "Mine Shaft"], ["#8B9C90", "Fruit Salad"], ["#8B9FEE", "Cornflower Blue"],
    ["#8BA698", "Fruit Salad"], ["#8BA9A5", "Ocean Green"], ["#8BE6D8", "Aqua / Cyan"], ["#8C055E", "Claret"],
    ["#8C472F", "Coffee Bean"], ["#8C5738", "Coffee Bean"], ["#8C6400", "Deep Fir"], ["#8C8D90", "Gray"],
    ["#8D3312", "Night Rider"], ["#8D3F3F", "Night Rider"], ["#8D7662", "Mine Shaft"], ["#8D8974", "Deep Fir"],
    ["#8D90A1", "Gun Powder"], ["#8DB751", "Fruit Salad"], ["#8E0000", "Rosewood"], ["#8E3536", "Night Rider"],
    ["#8E44AD", "Wisteria"], ["#8E4D1E", "Coffee Bean"], ["#8E60EE", "Blue Gem"], ["#8E7618", "Deep Fir"],
    ["#8E8171", "Mine Shaft"], ["#8E8D70", "Deep Fir"], ["#8E9481", "Fruit Salad"], ["#8E9A9B", "Gun Powder"],
    ["#8F021C", "Rosewood"], ["#8F3E33", "Night Rider"], ["#8F4B0E", "Deep Fir"], ["#8F817F", "Gray"],
    ["#8F8B66", "Deep Fir"], ["#8F8D70", "Deep Fir"], ["#8F948D", "Fruit Salad"], ["#8F99FB", "Danube"],
    ["#8FAAD1", "Danube"], ["#8FB69C", "Ocean Green"], ["#900020", "Burgundy"], ["#901E1E", "Night Rider"],
    ["#907833", "Deep Fir"], ["#907B71", "Mine Shaft"], ["#908D39", "Deep Fir"], ["#914448", "Gun Powder"],
    ["#915F33", "Coffee Bean"], ["#916530", "Deep Fir"], ["#918183", "Gray"], ["#91AD1D", "Apple"],
    ["#91B77B", "Fruit Salad"], ["#92000A", "Rosewood"], ["#924321", "Night Rider"], ["#926F5B", "Mine Shaft"],
    ["#927010", "Deep Fir"], ["#92898B", "Gray"], ["#92D594", "Ocean Green"], ["#93003A", "Claret"],
    ["#931A00", "Deep Fir"], ["#934337", "Night Rider"], ["#9370DB", "Medium Purple"], ["#93CCEA", "Aqua / Cyan"],
    ["#93DFE5", "Aqua / Cyan"], ["#9400D3", "Dark Violet"], ["#944444", "Night Rider"], ["#944747", "Night Rider"],
    ["#948771", "Mine Shaft"], ["#948D31", "Deep Fir"], ["#949394", "Gray"], ["#950015", "Rosewood"],
    ["#956333", "Coffee Bean"], ["#959395", "Gray"], ["#959396", "Gray"], ["#95979A", "Gray"],
    ["#95AE1C", "Apple"], ["#960018", "Carmine"], ["#964B00", "Brown"], ["#967059", "Mine Shaft"],
    ["#9678B6", "Victoria"], ["#96BBAB", "Ocean Green"], ["#97605D", "Night Rider"], ["#977115", "Deep Fir"],
    ["#97D1EB", "Aqua / Cyan"], ["#988111", "Deep Fir"], ["#988D40", "Deep Fir"], ["#98FB98", "Pale Green"],
    ["#990000", "Crimson"], ["#990066", "Fresh Eggplant"], ["#991100", "Rosewood"], ["#991613", "Night Rider"],
    ["#9932CC", "Dark Orchid"], ["#993300", "Brown"], ["#996666", "Copper Rose"], ["#9966CC", "Amethyst"],
    ["#997A8D", "Gun Powder"], ["#999999", "Gray"], ["#99A4BC", "Bismarck"], ["#99BADD", "Danube"],
    ["#9A0000", "Rosewood"], ["#9A3820", "Night Rider"], ["#9A6E10", "Deep Fir"], ["#9A938A", "Mine Shaft"],
    ["#9A990B", "Deep Fir"], ["#9AB973", "Fruit Salad"], ["#9ACD32", "Yellow Green"], ["#9B0717", "Rosewood"],
    ["#9B111E", "Ruby"], ["#9B2F1F", "Night Rider"], ["#9B4703", "Deep Fir"], ["#9B9D91", "Gray"],
    ["#9C3336", "Night Rider"], ["#9C7C38", "Deep Fir"], ["#9C9C9C", "Gray"], ["#9D3312", "Night Rider"],
    ["#9D3F3F", "Night Rider"], ["#9D5800", "Deep Fir"], ["#9D7662", "Mine Shaft"], ["#9D8974", "Deep Fir"],
    ["#9D9101", "Deep Fir"], ["#9DBBEE", "Cornflower Blue"], ["#9E1B32", "Crimson"], ["#9E5E08", "Deep Fir"],
    ["#9E7B18", "Deep Fir"], ["#9E8171", "Mine Shaft"], ["#9F000F", "Rosewood"], ["#9F381D", "Night Rider"],
    ["#9F821C", "Deep Fir"], ["#9F9D91", "Gray"], ["#9FA3A7", "Gray"], ["#A00020", "Burgundy"],
    ["#A020F0", "Purple"], ["#A0522D", "Sienna"], ["#A1000A", "Rosewood"], ["#A171D9", "Victoria"],
    ["#A18788", "Gray"], ["#A1ADB5", "Gray"], ["#A1C126", "Apple"], ["#A1D1EF", "Aqua / Cyan"],
    ["#A2006D", "Fresh Eggplant"], ["#A23B6C", "Revolver"], ["#A27031", "Deep Fir"], ["#A2A2A2", "Gray"],
    ["#A2D2C1", "Aqua / Cyan"], ["#A30000", "Rosewood"], ["#A32638", "Crimson"], ["#A34337", "Night Rider"],
    ["#A38072", "Mine Shaft"], ["#A40000", "Rosewood"], ["#A4522D", "Sienna"], ["#A45D3D", "Coffee Bean"],
    ["#A4A0A3", "Gray"], ["#A4A4A4", "Gray"], ["#A4B4A8", "Fruit Salad"], ["#A4D8E0", "Aqua / Cyan"],
    ["#A50000", "Rosewood"], ["#A52A2A", "Brown"], ["#A5A0A5", "Gray"], ["#A5A4A7", "Gray"],
    ["#A5ADB0", "Gray"], ["#A5D18E", "Fruit Salad"], ["#A5E3D8", "Aqua / Cyan"], ["#A61022", "Crimson"],
    ["#A62F20", "Night Rider"], ["#A65529", "Coffee Bean"], ["#A6A6A6", "Gray"], ["#A6B4CC", "Bismarck"],
    ["#A70013", "Rosewood"], ["#A74324", "Night Rider"], ["#A75574", "Gun Powder"], ["#A77533", "Deep Fir"],
    ["#A7A7A7", "Gray"], ["#A7B1BF", "Bismarck"], ["#A81C07", "Rosewood"], ["#A8756E", "Gun Powder"],
    ["#A87D20", "Deep Fir"], ["#A89999", "Gray"], ["#A8ADB3", "Gray"], ["#A8B1C4", "Bismarck"],
    ["#A8C3A0", "Fruit Salad"], ["#A8E3E3", "Aqua / Cyan"], ["#A90000", "Rosewood"], ["#A91101", "Rosewood"],
    ["#A93324", "Night Rider"], ["#A9443B", "Coffee Bean"], ["#A95245", "Coffee Bean"], ["#A95D07", "Deep Fir"],
    ["#A97500", "Deep Fir"], ["#A98D36", "Deep Fir"], ["#A99988", "Mine Shaft"], ["#A9A491", "Mine Shaft"],
    ["#A9A9A9", "Gray"], ["#A9B2C3", "Bismarck"], ["#A9D8E2", "Aqua / Cyan"], ["#AA0000", "Rosewood"],
    ["#AA1C1C", "Night Rider"], ["#AA381E", "Night Rider"], ["#AA4203", "Deep Fir"], ["#AA4433", "Coffee Bean"],
    ["#AA6622", "Coffee Bean"], ["#AA8D6F", "Mine Shaft"], ["#AA98A1", "Gray"], ["#AAA9AD", "Gray"],
    ["#AAAAAA", "Gray"], ["#AAB2BE", "Gray"], ["#AAB7B8", "Gray"], ["#AABACD", "Bismarck"],
    ["#AAE3D1", "Aqua / Cyan"], ["#AB0563", "Fresh Eggplant"], ["#AB3403", "Deep Fir"], ["#AB4442", "Night Rider"],
    ["#AB446E", "Revolver"], ["#AB4E52", "Night Rider"], ["#AB6663", "Night Rider"], ["#AB917A", "Mine Shaft"],
    ["#ABA196", "Mine Shaft"], ["#ABA9AD", "Gray"], ["#ABAAB1", "Gray"], ["#ABB2C3", "Bismarck"],
    ["#ABB7A9", "Fruit Salad"], ["#ABC1A0", "Fruit Salad"], ["#ABCDEF", "Cornflower Blue"], ["#ABD1A6", "Fruit Salad"],
    ["#ABEBDA", "Aqua / Cyan"], ["#AC0812", "Rosewood"], ["#AC1C1C", "Night Rider"], ["#AC442E", "Night Rider"],
    ["#AC483E", "Night Rider"], ["#AC512D", "Coffee Bean"], ["#AC5414", "Deep Fir"], ["#AC5B2B", "Deep Fir"],
    ["#AC6D5E", "Night Rider"], ["#AC7500", "Deep Fir"], ["#AC867D", "Night Rider"], ["#ACA191", "Mine Shaft"],
    ["#ACA494", "Mine Shaft"], ["#ACA586", "Deep Fir"], ["#ACACAC", "Gray"], ["#ACB3B1", "Gray"],
    ["#ACCBB1", "Fruit Salad"], ["#AD0622", "Rosewood"], ["#AD1A01", "Rosewood"], ["#AD3324", "Night Rider"],
    ["#AD4448", "Night Rider"], ["#AD522D", "Sienna"], ["#AD7500", "Deep Fir"], ["#AD7D02", "Deep Fir"],
    ["#AD8D33", "Deep Fir"], ["#AD9988", "Mine Shaft"], ["#AD9999", "Gray"], ["#ADA491", "Mine Shaft"],
    ["#ADA9B2", "Gray"], ["#ADB1C3", "Bismarck"], ["#ADB2BD", "Gray"], ["#ADB3BA", "Gray"],
    ["#ADB3C1", "Bismarck"], ["#ADDFE2", "Aqua / Cyan"], ["#AE0C00", "Rosewood"], ["#AE2721", "Night Rider"],
    ["#AE4560", "Night Rider"], ["#AE4A12", "Deep Fir"], ["#AE6408", "Deep Fir"], ["#AE6D58", "Night Rider"],
    ["#AE80D1", "Medium Purple"], ["#AEA1B1", "Gray"], ["#AEADB3", "Gray"], ["#AEB3B1", "Gray"],
    ["#AECBBA", "Fruit Salad"], ["#AEE3D8", "Aqua / Cyan"], ["#AF002A", "Rosewood"], ["#AF2D21", "Night Rider"],
    ["#AF4035", "Night Rider"], ["#AF4444", "Night Rider"], ["#AF4D43", "Night Rider"], ["#AF5D00", "Deep Fir"],
    ["#AF641A", "Deep Fir"], ["#AF7783", "Night Rider"], ["#AF8261", "Coffee Bean"], ["#AF8ACA", "Danube"],
    ["#AF8F2C", "Deep Fir"], ["#AF9483", "Mine Shaft"], ["#AF9980", "Mine Shaft"], ["#AFA09F", "Gray"],
    ["#AFA491", "Mine Shaft"], ["#AFA9B1", "Gray"], ["#AFB1B8", "Gray"], ["#AFB1C4", "Bismarck"],
    ["#AFB1D1", "Danube"], ["#AFBDC1", "Bismarck"], ["#AFE3D6", "Aqua / Cyan"], ["#AFE4E6", "Aqua / Cyan"],
    ["#B00020", "Burgundy"], ["#B0263C", "Crimson"], ["#B0363F", "Night Rider"], ["#B0444A", "Night Rider"],
    ["#B05D00", "Deep Fir"], ["#B05E1A", "Deep Fir"], ["#B06426", "Deep Fir"], ["#B06608", "Deep Fir"],
    ["#B07233", "Deep Fir"], ["#B07D3E", "Deep Fir"], ["#B08E6B", "Mine Shaft"], ["#B09101", "Deep Fir"],
    ["#B09871", "Mine Shaft"], ["#B0A1A1", "Gray"], ["#B0A3A0", "Gray"], ["#B0A491", "Mine Shaft"],
    ["#B0A891", "Mine Shaft"], ["#B0A9B1", "Gray"], ["#B0B1B8", "Gray"], ["#B0B1B9", "Gray"],
    ["#B0B1C4", "Bismarck"], ["#B0B3BA", "Gray"], ["#B0B7C1", "Bismarck"], ["#B0C4CC", "Bismarck"],
    ["#B0D0D3", "Bismarck"], ["#B0E0E6", "Powder Blue"], ["#B10000", "Maroon"], ["#B11224", "Crimson"],
    ["#B14A2F", "Night Rider"], ["#B16D52", "Night Rider"], ["#B19111", "Deep Fir"], ["#B19461", "Mine Shaft"],
    ["#B1A1A1", "Gray"], ["#B1A3A0", "Gray"], ["#B1A491", "Mine Shaft"], ["#B1B1B1", "Gray"],
    ["#B22222", "Fire Brick"], ["#B3446C", "Night Rider"], ["#B35A57", "Night Rider"], ["#B3633D", "Deep Fir"],
    ["#B3663F", "Deep Fir"], ["#B37361", "Night Rider"], ["#B3785A", "Night Rider"], ["#B37D44", "Deep Fir"],
    ["#B37E3E", "Deep Fir"], ["#B38019", "Deep Fir"], ["#B38ACA", "Danube"], ["#B39971", "Mine Shaft"],
    ["#B3B3B3", "Gray"], ["#B43332", "Night Rider"], ["#B44668", "Night Rider"], ["#B48395", "Night Rider"],
    ["#B5651D", "Light Brown"], ["#B5A642", "Brass"], ["#B5B5B5", "Gray"], ["#B6BDC1", "Bismarck"],
    ["#B7410E", "Rust"], ["#B76E79", "Rose Gold"], ["#B78727", "Deep Fir"], ["#B83321", "Night Rider"],
    ["#B87333", "Copper"], ["#B8860B", "Dark Goldenrod"], ["#B94E48", "Night Rider"], ["#B98D28", "Deep Fir"],
    ["#B99351", "Mine Shaft"], ["#B99FAF", "Bismarck"], ["#BA0000", "Maroon"], ["#BA4433", "Night Rider"],
    ["#BA55D3", "Medium Orchid"], ["#BA6262", "Night Rider"], ["#BA6F5B", "Night Rider"], ["#BA7F03", "Deep Fir"],
    ["#BA9100", "Deep Fir"], ["#BB3385", "Fresh Eggplant"], ["#BB4444", "Night Rider"], ["#BB6666", "Copper Rose"],
    ["#BB9988", "Mine Shaft"], ["#BC8F8F", "Rosy Brown"], ["#BD33A4", "Fresh Eggplant"], ["#BD7F34", "Deep Fir"],
    ["#BD8139", "Deep Fir"], ["#BD9101", "Deep Fir"], ["#BDBC7F", "Fruit Salad"], ["#BDB76B", "Dark Khaki"],
    ["#BE3339", "Night Rider"], ["#BEBEBE", "Gray"], ["#BEF0F1", "Aqua / Cyan"], ["#BF3F3F", "Night Rider"],
    ["#BF5500", "Deep Fir"], ["#BF5E18", "Deep Fir"], ["#BF7F17", "Deep Fir"], ["#BF8E1C", "Deep Fir"],
    ["#BFA7AC", "Night Rider"], ["#BFB8B0", "Mine Shaft"], ["#BFBFBF", "Gray"], ["#C04000", "Mahogany"],
    ["#C0C0C0", "Silver"], ["#C1440E", "Deep Fir"], ["#C154C1", "Fuchsia"], ["#C191D1", "Medium Purple"],
    ["#C1A004", "Deep Fir"], ["#C1ADB5", "Gray"], ["#C1C1C1", "Gray"], ["#C1D1EF", "Cornflower Blue"],
    ["#C20067", "Fresh Eggplant"], ["#C20078", "Fresh Eggplant"], ["#C2B280", "Sandwisp"], ["#C3B091", "Sandwisp"],
    ["#C41E3A", "Cardinal"], ["#C4C3D0", "Lavender"], ["#C4D8E2", "Aqua / Cyan"], ["#C50000", "Maroon"],
    ["#C5B0D2", "Medium Purple"], ["#C60122", "Maroon"], ["#C71585", "Medium Violet Red"], ["#C7C7C7", "Gray"],
    ["#C80000", "Maroon"], ["#C80815", "Venetian Red"], ["#C90016", "Maroon"], ["#C9A0DC", "Wisteria"],
    ["#C9C0BB", "Silver"], ["#C9FFE5", "Aqua / Cyan"], ["#CA1F7B", "Fresh Eggplant"], ["#CAE00D", "Lime"],
    ["#CB410B", "Rust"], ["#CB4154", "Brick Red"], ["#CC0000", "Maroon"], ["#CC3333", "Persian Red"],
    ["#CC4E5C", "Night Rider"], ["#CC6666", "Fuzzy Wuzzy"], ["#CC7722", "Ochre"], ["#CC8899", "Puce"],
    ["#CC9900", "Gold"], ["#CC9966", "Woody Brown"], ["#CCCCFF", "Periwinkle"], ["#CD5C5C", "Indian Red"],
    ["#CD7F32", "Bronze"], ["#CD853F", "Peru"], ["#CE2029", "Fire Engine Red"], ["#D1001C", "Maroon"],
    ["#D16913", "Chocolate"], ["#D19FE8", "Wisteria"], ["#D1E231", "Pear"], ["#D2691E", "Chocolate"],
    ["#D2B48C", "Tan"], ["#D3D3D3", "Light Gray"], ["#D40000", "Maroon"], ["#D473D4", "Fuchsia"],
    ["#D4AF37", "Gold"], ["#D87093", "Pale Violet Red"], ["#D8BFD8", "Thistle"], ["#DA70D6", "Orchid"],
    ["#DAA520", "Goldenrod"], ["#DB7093", "Pale Violet Red"], ["#DC143C", "Crimson"], ["#DCDCDC", "Gainsboro"],
    ["#DDA0DD", "Plum"], ["#DE3163", "Cerise"], ["#DEB887", "Burly Wood"], ["#E0115F", "Cherry"],
    ["#E0B0FF", "Mauve"], ["#E1A2B8", "Gray"], ["#E30022", "Maroon"], ["#E32636", "Alizarin Crimson"],
    ["#E4717A", "Candy Pink"], ["#E52B50", "Amaranth"], ["#E5E4E2", "Platinum"], ["#E6E6FA", "Lavender"],
    ["#E97451", "Burnt Sienna"], ["#E9967A", "Dark Salmon"], ["#EB4C42", "Carmine Pink"], ["#EC5800", "Persimmon"],
    ["#ED872D", "Cadmium Orange"], ["#EE82EE", "Violet"], ["#F08080", "Light Coral"], ["#F0E68C", "Khaki"],
    ["#F0F8FF", "Alice Blue"], ["#F0FFF0", "Honeydew"], ["#F0FFFF", "Azure"], ["#F28500", "Tangerine"],
    ["#F400A1", "Fresh Eggplant"], ["#F4C430", "Saffron"], ["#F5F5DC", "Beige"], ["#F5F5F5", "White Smoke"],
    ["#F5FFFA", "Mint Cream"], ["#F8F8FF", "Ghost White"], ["#FA8072", "Salmon"], ["#FAEBD7", "Antique White"],
    ["#FAF0E6", "Linen"], ["#FAFAD2", "Light Goldenrod Yellow"], ["#FDF5E6", "Old Lace"], ["#FF0000", "Red"],
    ["#FF007F", "Rose"], ["#FF00FF", "Magenta / Fuchsia"], ["#FF1493", "Deep Pink"], ["#FF2400", "Scarlet"],
    ["#FF3300", "Red-Orange"], ["#FF4500", "Orange Red"], ["#FF4D00", "Vermilion"], ["#FF6347", "Tomato"],
    ["#FF66CC", "Hot Pink"], ["#FF69B4", "Hot Pink"], ["#FF7F50", "Coral"], ["#FF8C00", "Dark Orange"],
    ["#FFA07A", "Light Salmon"], ["#FFA500", "Orange"], ["#FFB6C1", "Light Pink"], ["#FFC0CB", "Pink"],
    ["#FFD700", "Gold"], ["#FFDAB9", "Peach Puff"], ["#FFDEAD", "Navajo White"], ["#FFE4B5", "Moccasin"],
    ["#FFE4C4", "Bisque"], ["#FFE4E1", "Misty Rose"], ["#FFEBCD", "Blanched Almond"], ["#FFEFD5", "Papaya Whip"],
    ["#FFF0F5", "Lavender Blush"], ["#FFF5EE", "Seashell"], ["#FFF8DC", "Cornsilk"], ["#FFFACD", "Lemon Chiffon"],
    ["#FFFAF0", "Floral White"], ["#FFFAFA", "Snow"], ["#FFFF00", "Yellow"], ["#FFFFE0", "Light Yellow"],
    ["#FFFFF0", "Ivory"], ["#FFFFFF", "White"]
];

// Helper to convert HEX to RGB
const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
};

// Helper to convert RGB to CMYK
const rgbToCmyk = (r: number, g: number, b: number) => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, m, y);

    if (k === 1) {
        return { c: 0, m: 0, y: 0, k: 100 };
    }

    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);

    return { c, m, y, k };
};

// Find nearest color name using Euclidean distance in RGB space
const getNearestColor = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    let minDistance = Infinity;
    let nearest = COLOR_NAMES[0];

    for (const [cHex, cName] of COLOR_NAMES) {
        const { r: cr, g: cg, b: cb } = hexToRgb(cHex);
        const distance = Math.sqrt(
            Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearest = [cHex, cName];
        }
    }
    return nearest;
};

export default function ColorNamesTool() {
    const [color, setColor] = useState('#6366F1');
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const { t } = useLanguage();

    const rgb = hexToRgb(color);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    const [nearestHex, nearestName] = getNearestColor(color);

    const filteredColors = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return COLOR_NAMES.filter(([hex, name]) => 
            name.toLowerCase().includes(query) || hex.toLowerCase().includes(query)
        ).slice(0, 100); // Limit display for performance
    }, [searchQuery]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: `${label}: ${text} copied to clipboard.`,
        });
    };

    const randomizeColor = () => {
        const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        setColor(randomHex.toUpperCase());
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Palette className="w-8 h-8" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black tracking-tight">Color Shades & Names</CardTitle>
                                <CardDescription className="text-white/70 font-bold">Discover names, RGB, and CMYK values for any color shade.</CardDescription>
                            </div>
                        </div>
                        <Button onClick={randomizeColor} variant="ghost" className="h-12 px-6 rounded-xl font-black gap-2 text-white hover:bg-white/20">
                            <RefreshCw className="w-4 h-4" /> Randomize
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Side: Color Picker & Details */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-sm font-black uppercase tracking-widest text-primary/60">Select Color</label>
                                <div className="flex flex-col sm:flex-row gap-6 items-center bg-muted/30 p-6 rounded-3xl border-2">
                                    <input 
                                        type="color" 
                                        value={color} 
                                        onChange={(e) => setColor(e.target.value.toUpperCase())}
                                        className="w-32 h-32 rounded-3xl cursor-pointer bg-transparent border-0 p-0 shadow-xl"
                                    />
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Hex Value</span>
                                            <div className="flex gap-2">
                                                <Input 
                                                    value={color} 
                                                    onChange={(e) => setColor(e.target.value.toUpperCase())}
                                                    className="font-mono text-xl font-bold h-12"
                                                />
                                                <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => copyToClipboard(color, 'Hex')}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                            <span className="text-xs font-bold text-primary/60 uppercase">Nearest Name</span>
                                            <p className="text-2xl font-black text-primary">{nearestName}</p>
                                            <p className="text-xs font-mono text-muted-foreground">Approx: {nearestHex}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-6 bg-muted/20 rounded-3xl border-2 space-y-4">
                                    <h3 className="font-black uppercase text-xs tracking-widest text-primary/60">RGB Values</h3>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20"><span className="block text-[10px] font-bold text-red-500">R</span><span className="font-mono font-bold">{rgb.r}</span></div>
                                        <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20"><span className="block text-[10px] font-bold text-green-500">G</span><span className="font-mono font-bold">{rgb.g}</span></div>
                                        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20"><span className="block text-[10px] font-bold text-blue-500">B</span><span className="font-mono font-bold">{rgb.b}</span></div>
                                    </div>
                                    <Button variant="outline" className="w-full font-bold" onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'RGB')}>Copy RGB</Button>
                                </div>
                                <div className="p-6 bg-muted/20 rounded-3xl border-2 space-y-4">
                                    <h3 className="font-black uppercase text-xs tracking-widest text-primary/60">CMYK Values</h3>
                                    <div className="grid grid-cols-4 gap-1 text-center">
                                        <div className="p-1 bg-cyan-500/10 rounded-lg"><span className="block text-[8px] font-bold">C</span><span className="text-xs font-mono font-bold">{cmyk.c}%</span></div>
                                        <div className="p-1 bg-magenta-500/10 rounded-lg"><span className="block text-[8px] font-bold">M</span><span className="text-xs font-mono font-bold">{cmyk.m}%</span></div>
                                        <div className="p-1 bg-yellow-500/10 rounded-lg"><span className="block text-[8px] font-bold">Y</span><span className="text-xs font-mono font-bold">{cmyk.y}%</span></div>
                                        <div className="p-1 bg-slate-500/10 rounded-lg"><span className="block text-[8px] font-bold">K</span><span className="text-xs font-mono font-bold">{cmyk.k}%</span></div>
                                    </div>
                                    <Button variant="outline" className="w-full font-bold" onClick={() => copyToClipboard(`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, 'CMYK')}>Copy CMYK</Button>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Searchable Database */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-sm font-black uppercase tracking-widest text-primary/60">Search Color Database</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search by name or hex..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-12 h-12 rounded-2xl"
                                    />
                                </div>
                            </div>

                            <div className="bg-muted/10 rounded-3xl border-2 overflow-hidden">
                                <div className="h-[400px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                    {filteredColors.map(([h, n]) => (
                                        <div 
                                            key={h} 
                                            onClick={() => setColor(h)}
                                            className={`group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer border ${color === h ? 'bg-primary/10 border-primary/20 shadow-sm' : 'hover:bg-muted/50 border-transparent'}`}
                                        >
                                            <div className="w-12 h-12 rounded-xl shadow-inner border border-black/5" style={{ backgroundColor: h }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{n}</p>
                                                <p className="font-mono text-[10px] text-muted-foreground">{h}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); copyToClipboard(h, 'Hex'); }}>
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    {filteredColors.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm font-bold">No colors found</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-muted/30 border-t-2 text-[10px] flex items-center gap-2 text-muted-foreground">
                                    <Info className="w-3 h-3" />
                                    <span>Showing top {filteredColors.length} matches from database. Pick any color to get details.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
