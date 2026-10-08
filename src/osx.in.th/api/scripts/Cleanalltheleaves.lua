local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Clean All The Leaves"

local success, OSX = pcall(function()
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success or not OSX then
    warn("OSX: Local file not found or failed to load, loading from GitHub...")
    local githubSuccess, githubOSX = pcall(function()
        return loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
    end)
    if githubSuccess and githubOSX then
        OSX = githubOSX
    else
        error("OSX: Failed to load library from both local file and GitHub!")
    end
end

-- Services & Local Player
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local LocalPlayer = Players.LocalPlayer

-- Safe Non-blocking Remotes & Modules References
local CollectLeaf = nil
local EmptyBackpack = nil
local LeafSim = nil
local SoundController = nil
local PlayerUpgradeConfig = nil
local LeafNet = nil

-- โหลดโมดูลในพื้นหลังโดยไม่ทำให้สคริปต์หยุดค้าง
task.spawn(function()
    local remotes = ReplicatedStorage:WaitForChild("Remotes", 5)
    if remotes then
        CollectLeaf = remotes:WaitForChild("CollectLeaf", 5)
        EmptyBackpack = remotes:WaitForChild("EmptyBackpack", 5)
    end
    
    local playerScripts = LocalPlayer:FindFirstChild("PlayerScripts")
    if playerScripts then
        pcall(function() LeafSim = require(playerScripts:FindFirstChild("LeafSim")) end)
    end
    pcall(function() SoundController = require(ReplicatedStorage:FindFirstChild("SoundController")) end)
    pcall(function() PlayerUpgradeConfig = require(ReplicatedStorage:FindFirstChild("PlayerUpgradeConfig")) end)
    pcall(function() LeafNet = require(ReplicatedStorage:FindFirstChild("LeafNet")) end)
end)

local Window = OSX:CreateWindow({
    Title = "OSX HUB | CLEAN ALL THE LEAVES",
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- Tabs (Info อยู่บนสุด)
local TabInfo = Window:AddTab({ Title = "Info", Icon = "info", SubDescription = "Script Information" })
local TabItems = Window:AddTab({ Title = "Unlock Items", Icon = "box", SubDescription = "Selectable Item & Tool Unlocks" })
local TabMods = Window:AddTab({ Title = "Mods & Upgrades", Icon = "zap", SubDescription = "Stats, Tools & Cooldowns" })

-- ==================== TAB 1: INFO ====================
local DevPanel = TabInfo:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer Main", "LilYouDev1997x")
DevPanel:AddInfoLabel("Developer Support", "0b1100001cat")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "Clipboard", Content = "Discord Link Copied!"})
    end
})

-- ==================== TAB 3: UNLOCK ITEMS (แบบเลือกได้) ====================
local ItemPanel = TabItems:AddPanel("Unlock Items & Tools")

local itemStates = {}
local itemConnections = {}

local function setItemStates(attrs, enabled)
    for _, attr in ipairs(attrs) do
        itemStates[attr] = enabled
        if enabled then
            LocalPlayer:SetAttribute(attr, true)
            if not itemConnections[attr] then
                itemConnections[attr] = LocalPlayer:GetAttributeChangedSignal(attr):Connect(function()
                    if itemStates[attr] and LocalPlayer:GetAttribute(attr) ~= true then
                        LocalPlayer:SetAttribute(attr, true)
                    end
                end)
            end
        else
            LocalPlayer:SetAttribute(attr, false)
            if itemConnections[attr] then
                itemConnections[attr]:Disconnect()
                itemConnections[attr] = nil
            end
        end
    end
end

ItemPanel:AddToggle({
    Title = "Unlock Rake",
    Description = "ปลดล็อก Rake + Perm Rake ถาวร",
    Default = false,
    Callback = function(Value) setItemStates({"OwnsRake", "PermRake"}, Value) end
})

ItemPanel:AddToggle({
    Title = "Unlock Leaf Blower",
    Description = "ปลดล็อก Leaf Blower + Perm Leaf Blower ถาวร",
    Default = false,
    Callback = function(Value) setItemStates({"OwnsLeafBlower", "PermLeafBlower"}, Value) end
})

ItemPanel:AddToggle({
    Title = "Unlock Leaf Vacuum",
    Description = "ปลดล็อก Leaf Vacuum + Perm Leaf Vacuum ถาวร",
    Default = false,
    Callback = function(Value) setItemStates({"OwnsLeafVacuum", "PermLeafVacuum"}, Value) end
})

ItemPanel:AddToggle({
    Title = "Unlock Molotov",
    Description = "ปลดล็อก Molotov + Perm Molotov ถาวร",
    Default = false,
    Callback = function(Value) setItemStates({"OwnsMolotov", "PermMolotov"}, Value) end
})

ItemPanel:AddToggle({
    Title = "Unlock Leaf Mover",
    Description = "ปลดล็อก Perm Leaf Mover ถาวร",
    Default = false,
    Callback = function(Value) setItemStates({"PermLeafMover"}, Value) end
})

-- ==================== TAB 4: MODS & UPGRADES ====================
local RakePanel = TabMods:AddPanel("Fast Rake Tool")
local UpgPanel = TabMods:AddPanel("Max Upgrades & Stats")
local CdPanel = TabMods:AddPanel("Cooldown Bypass")

-- Fast Rake Logic
local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Exclude
rayParams.IgnoreWater = true

local function computeRakeAimPos()
    local cam = Workspace.CurrentCamera
    local char = LocalPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart")
    if not cam or not hrp then return nil end
    rayParams.FilterDescendantsInstances = {char}
    local result = Workspace:Raycast(cam.CFrame.Position, cam.CFrame.LookVector * 50, rayParams)
    return if result then result.Position else hrp.Position + cam.CFrame.LookVector * 10
end

local isHolding = false
local autoRakeEnabled = false

local function instantRake()
    local aim = computeRakeAimPos()
    if aim and LeafSim then
        pcall(function() if SoundController then SoundController.play("RakeSFX") end end)
        LeafSim.rake(aim)
    end
end

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed or not autoRakeEnabled then return end
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        isHolding = true
        if (LocalPlayer:GetAttribute("SelectedTool") or "Hand") == "Rake" then
            instantRake()
            task.spawn(function()
                while isHolding and autoRakeEnabled do
                    if (LocalPlayer:GetAttribute("SelectedTool") or "Hand") == "Rake" 
                       and not LocalPlayer:GetAttribute("JournalOpen") 
                       and not LocalPlayer:GetAttribute("ToolShopFocus") then
                        instantRake()
                        task.wait(0.08)
                    else 
                        break 
                    end
                end
            end)
        end
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        isHolding = false
    end
end)

RakePanel:AddToggle({
    Title = "Instant Rake Hold",
    Description = "กดคุมเมาส์เพื่อกวาดใบไม้ด้วย Rake แบบรวดเร็วอัตโนมัติ",
    Default = false,
    Callback = function(Value)
        autoRakeEnabled = Value
    end
})

-- Upgrade Attributes & Hooks
local upgradeAttributes = {
    Upg_Hand_Hold = 1,
    Upg_Hand_Dexterity = 5,
    Upg_Hand_Grasp = 5,
    Upg_Rake_Radius = 5,
    Upg_Rake_Range = 4,
    Upg_Rake_Stickiness = 4,
    Upg_LeafBlower_Width = 5,
    Upg_LeafBlower_Power = 4,
    Upg_LeafBlower_Spread = 4,
    LobbyWalkSpeed = 21,
    LobbyBagBonus = 125,
    LobbyCashMult = 1.5,
    LobbyGemsMult = 1.5,
    LobbyRakeDiscount = 1,
    LobbyBlowerDiscount = 1,
}

local oldLevelOf = PlayerUpgradeConfig and PlayerUpgradeConfig.levelOf
local oldUpgEffect = LeafSim and LeafSim.upgEffect

UpgPanel:AddToggle({
    Title = "Max Upgrades & Stats Spoof",
    Description = "แม็กซ์ค่าอัพเกรด Hand, Rake, Blower, Speed, Bag Bonus",
    Default = false,
    Callback = function(Value)
        if Value then
            for attr, val in pairs(upgradeAttributes) do
                LocalPlayer:SetAttribute(attr, val)
                LocalPlayer:GetAttributeChangedSignal(attr):Connect(function()
                    if LocalPlayer:GetAttribute(attr) ~= val then
                        LocalPlayer:SetAttribute(attr, val)
                    end
                end)
            end
            
            if PlayerUpgradeConfig then
                PlayerUpgradeConfig.levelOf = function() return 5 end
            end
            
            if LeafSim then
                LeafSim.upgEffect = function(tool, upgrade)
                    if tool == "Hand" then
                        if upgrade == "Dexterity" then return 0
                        elseif upgrade == "Hold" then return 1
                        elseif upgrade == "Grasp" then return 6
                        end
                    elseif tool == "Rake" then
                        if upgrade == "Range" then return 20
                        elseif upgrade == "Radius" then return 6
                        elseif upgrade == "Stickiness" then return 160
                        end
                    elseif tool == "LeafBlower" then
                        if upgrade == "Width" then return 6
                        elseif upgrade == "Power" then return 2.5
                        elseif upgrade == "Spread" then return 0.2
                        end
                    end
                    return oldUpgEffect and oldUpgEffect(tool, upgrade) or 0
                end
            end
            OSX:Notify({Title = "Upgrades", Content = "Max Stats Applied!", Type = "Success"})
        else
            if PlayerUpgradeConfig and oldLevelOf then
                PlayerUpgradeConfig.levelOf = oldLevelOf
            end
            if LeafSim and oldUpgEffect then
                LeafSim.upgEffect = oldUpgEffect
            end
        end
    end
})

-- Cooldown Attributes
local cooldownAttributes = {
    HandCooldown = false,
    RakeCooldown = false,
    MolotovCooldown = false,
}

CdPanel:AddToggle({
    Title = "No Tool Cooldowns",
    Description = "ยกเลิกคูลดาวน์ Hand, Rake, Molotov",
    Default = false,
    Callback = function(Value)
        if Value then
            for attr, _ in pairs(cooldownAttributes) do
                LocalPlayer:SetAttribute(attr, false)
                LocalPlayer:GetAttributeChangedSignal(attr):Connect(function()
                    if LocalPlayer:GetAttribute(attr) == true then
                        LocalPlayer:SetAttribute(attr, false)
                    end
                end)
            end
            OSX:Notify({Title = "Cooldowns", Content = "No Cooldowns Enabled!", Type = "Success"})
        end
    end
})

OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success"
})