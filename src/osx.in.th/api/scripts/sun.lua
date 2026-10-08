local targetPosition = game.Players.LocalPlayer.Character.HumanoidRootPart.Position
local distance = 10


local UserInputService = game:GetService("UserInputService")
local Teams = game:GetService("Teams")
local player = game.Players.LocalPlayer

local selectedTeams = {}
local selectedPlayers = {}

-- Load OSX Lib
local OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()

-- Create main window
local Window = OSX:CreateWindow({
    Title = "OSX HUB | Teleport Script",
    Subtitle = "by LilYouDev1997",
    Theme = "Dark",
    Size = UDim2.new(0, 340, 0, 600),
    Resizable = false,
})

-- Add a Tab
local MainTab = Window:AddTab({
    Title = "Teleport",
    Icon = "map"
})

-- State variables
local isTeleporting = false

-- Teleport toggle
MainTab:AddToggle({
    Title = "Enable Teleport",
    Description = "Toggle the teleportation loop",
    Default = false,
    Callback = function(state)
        isTeleporting = state
    end,
})

-- Distance slider (1-50)
MainTab:AddSlider({
    Title = "Teleport Distance",
    Description = "Distance in studs",
    Min = 1,
    Max = 50,
    Default = distance,
    Rounding = 0,
    Callback = function(val)
        distance = math.floor(val)
    end,
})

-- Helper to get team names
local function getTeamNames()
    local names = {}
    for _, team in ipairs(Teams:GetTeams()) do
        table.insert(names, team.Name)
    end
    return names
end

-- Helper to get player names (excluding local player)
local function getPlayerNames()
    local names = {}
    for _, plr in ipairs(game.Players:GetPlayers()) do
        if plr ~= player then
            table.insert(names, plr.Name)
        end
    end
    return names
end

-- MultiDropdown for teams
MainTab:AddMultiDropdown({
    Title = "Select Teams",
    Description = "Teleport players in these teams",
    Values = getTeamNames(),
    Default = {},
    Callback = function(selected)
        selectedTeams = {}
        for _, name in ipairs(selected) do
            local team = Teams:FindFirstChild(name)
            if team then
                selectedTeams[name] = team
            end
        end
    end,
})

-- MultiDropdown for players
MainTab:AddMultiDropdown({
    Title = "Select Players",
    Description = "Teleport these specific players",
    Values = getPlayerNames(),
    Default = {},
    Callback = function(selected)
        selectedPlayers = {}
        for _, name in ipairs(selected) do
            local plr = game.Players:FindFirstChild(name)
            if plr then
                selectedPlayers[name] = plr
            end
        end
    end,
})

-- Close button
MainTab:AddButton({
    Title = "Unload Script",
    Callback = function()
        Window:Destroy()
        isTeleporting = false
    end,
})

-- Main Loop
while true do
    if isTeleporting then
        local lookVector = game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame.LookVector
        local myPosition = game.Players.LocalPlayer.Character.HumanoidRootPart.Position
        local newPosition = myPosition + (lookVector * distance)
        
        -- ตรวจสอบว่ามีการเลือกทีมหรือผู้เล่นหรือไม่
        local hasSelection = false
        for _ in pairs(selectedTeams) do
            hasSelection = true
            break
        end
        if not hasSelection then
            for _ in pairs(selectedPlayers) do
                hasSelection = true
                break
            end
        end
        
        for _, otherPlayer in ipairs(game.Players:GetPlayers()) do
            if otherPlayer ~= game.Players.LocalPlayer and otherPlayer.Character and otherPlayer.Character:FindFirstChild("HumanoidRootPart") then
                -- ถ้าไม่ได้เลือกอะไรเลย = Teleport All
                if not hasSelection then
                    otherPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(newPosition)
                -- ถ้าเลือกแล้ว ตรวจสอบว่าเลือกผู้เล่นโดยตรง หรือ เลือกทีมของผู้เล่น
                elseif selectedPlayers[otherPlayer.Name] or (otherPlayer.Team and selectedTeams[otherPlayer.Team.Name]) then
                    otherPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(newPosition)
                end
            end
        end
    end
    task.wait(0.1)
end