-- [[ Bite by Night | OSX HUB ]] --
-- UI Library Loader
local success, OSX = pcall(function()
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success then
    OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
end

-- Fetch Game Name
local success, productInfo = pcall(function()
    return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
end)
local GameName = success and productInfo and productInfo.Name or "Bite by Night"

-- [[ SERVICES ]] --
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")
local localPlayer = Players.LocalPlayer

-- [[ STARTUP CLEANUP (Fixes flickering old ESP) ]] --
for _, v in pairs(workspace:GetDescendants()) do
    if v.Name == "Generator_ESP" or v.Name == "Generator_Highlight" or string.match(v.Name, "^BBN_") then
        v:Destroy()
    end
end

-- [[ STATE VARIABLES ]] --
_G.BBN_FullBright = false
_G.CFrameSpeed = false
_G.CFrameValue = 0.01
_G.NoClip = false
_G.InfiniteJump = false
_G.BBN_GenHighlight = false
_G.BBN_GenProgress = false
_G.BBN_AliveHighlight = false
_G.BBN_KillerHighlight = false
_G.BBN_DoorHighlight = false
_G.BBN_AutoMinigame = false
_G.BBN_InfStamina = false
_G.BBN_BatteryESP = false
_G.BBN_TrapESP = false
_G.BBN_MinionESP = false


-- ESP Colors (Default)
_G.BBN_SurvivorColor = Color3.fromRGB(0, 255, 0)
_G.BBN_KillerColor = Color3.fromRGB(255, 0, 0)
_G.BBN_DoorColor = Color3.fromRGB(252, 252, 252)
_G.BBN_GeneratorColor = Color3.fromRGB(225, 0, 255)
_G.BBN_BatteryColor = Color3.fromRGB(0, 255, 255)
_G.BBN_BatteryHeldColor = Color3.fromRGB(255, 255, 0)
_G.BBN_TrapColor = Color3.fromRGB(255, 0, 0)
_G.BBN_MinionColor = Color3.fromRGB(255, 0, 0)


-- Window Setup
local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

Window:ShowUpdate({
    Title = "Bite By Night Update!",
    Version = OSX.Version,
    Changelog = {
        "เพิ่มฟังชั่น ออร่ากับดักมินเนียน",
        "เพิ่มฟั่งชั่น ปรับสีออร่ากับดักมินเนียน",
        "เเก้ไข บัคเเละปัญหา เล็กน้อยที่พบเจอ",
        "เเก้ไข อาการกิน CPU เครื่องมากเกินไปทำให้กระตุก",
        "ทำการ ตรวจสอบ ระบบทั้งหมดเพื่อเช็คการทำงานเนื่องจากเกมอัพเดต"
    },
    ButtonText = "Let's Go!",
    Callback = function()
        print("User accepted the update!")
    end
})

-- [[ TABS ]] --

-- 1. Info Tab
local InfoTab = Window:AddTab({
    Title = "Info",
    SubDescription = "User & Script Information",
    Icon = "info"
})

-- 2. Player Tab
local PlayerTab = Window:AddTab({
    Title = "Player",
    SubDescription = "Movement & Stats",
    Icon = "user"
})

-- 3. Visuals Tab
local VisualsTab = Window:AddTab({
    Title = "Visuals",
    SubDescription = "ESP & World Info",
    Icon = "eye"
})

-- 4. Auto Farm Tab
local AutoFarmTab = Window:AddTab({
    Title = "Auto Farm",
    SubDescription = "Automated Farming Logic",
    Icon = "sword"
})

-- Settings Tab
local SettingsTab = Window:AddTab({
    Title = "Settings",
    SubDescription = "UI & System Config",
    Icon = "settings"
})

-- [[ INFO TAB content ]] --
local CreditPanel = InfoTab:AddPanel("Credits")

CreditPanel:AddInfoLabel("Owner", "darkmxde.")
CreditPanel:AddInfoLabel("Developer", "LilYouDev1997x")
CreditPanel:AddInfoLabel("Last Update", "17/04/2026")

CreditPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord ของพวกเรา",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "System", Content = "Discord Link Copied!"})
    end
})

-- [[ PLAYER TAB content ]] --
local PlayerPanel = PlayerTab:AddPanel("Movement")

PlayerPanel:AddToggle({
    Title = "Infinite Stamina",
    Description = "สแตมินาไม่จำกัด (หลอดวิ่งไม่ลด!)",
    Default = false,
    Callback = function(Value) 
        _G.BBN_InfStamina = Value 
    end
})

PlayerPanel:AddToggle({
    Title = "CFrame Speed",
    Description = "เคลื่อนที่เร็วด้วยระบบ CFrame (bypass WalkSpeed)",
    Default = false,
    Callback = function(Value) _G.CFrameSpeed = Value end
})

PlayerPanel:AddSlider({
    Title = "Speed Value",
    Description = "ปรับความละเอียดของ CFrame Speed (เริ่มต้น 0.01)",
    Min = 0.01,
    Max = 0.05,
    Default = 0.01,
    Rounding = 2,
    Callback = function(Value) _G.CFrameValue = Value end
})

-- [[ VISUALS TAB content ]] --
local EspPanel = VisualsTab:AddPanel("World ESP")

EspPanel:AddToggle({
    Title = "Full Brightness",
    Description = "เพิ่มเเสงสว่างสำหรับเเมพมืด",
    Default = false,
    Callback = function(Value)
        _G.BBN_FullBright = Value
        
        if Value then
            -- Save current map lighting state before overriding
            _G.SavedLighting = {
                Brightness = Lighting.Brightness,
                ClockTime = Lighting.ClockTime,
                FogEnd = Lighting.FogEnd,
                GlobalShadows = Lighting.GlobalShadows,
                Ambient = Lighting.Ambient,
                OutdoorAmbient = Lighting.OutdoorAmbient,
                ColorShift_Bottom = Lighting.ColorShift_Bottom,
                ColorShift_Top = Lighting.ColorShift_Top,
                Effects = {}
            }
            
            for _, v in pairs(Lighting:GetChildren()) do
                if v:IsA("Atmosphere") then
                    _G.SavedLighting.Effects[v] = {Type = "Atmosphere", Density = v.Density}
                elseif v:IsA("PostEffect") then
                    _G.SavedLighting.Effects[v] = {Type = "PostEffect", Enabled = v.Enabled}
                end
            end
        else
            -- Restore exactly what was saved
            if _G.SavedLighting then
                pcall(function()
                    Lighting.Brightness = _G.SavedLighting.Brightness
                    Lighting.ClockTime = _G.SavedLighting.ClockTime
                    Lighting.FogEnd = _G.SavedLighting.FogEnd
                    Lighting.GlobalShadows = _G.SavedLighting.GlobalShadows
                    Lighting.Ambient = _G.SavedLighting.Ambient
                    Lighting.OutdoorAmbient = _G.SavedLighting.OutdoorAmbient
                    Lighting.ColorShift_Bottom = _G.SavedLighting.ColorShift_Bottom
                    Lighting.ColorShift_Top = _G.SavedLighting.ColorShift_Top
                    
                    for v, data in pairs(_G.SavedLighting.Effects) do
                        if v and v.Parent == Lighting then
                            if data.Type == "Atmosphere" then
                                v.Density = data.Density
                            elseif data.Type == "PostEffect" then
                                v.Enabled = data.Enabled
                            end
                        end
                    end
                end)
            end
        end
    end
})

EspPanel:AddToggle({
    Title = "Survivor Highlight",
    Description = "เเสดงออร่าผู้รอดชีวิต",
    Default = false,
    Callback = function(Value) 
        _G.BBN_AliveHighlight = Value 
        if not Value then
            for _, v in pairs(workspace:GetDescendants()) do
                if v.Name == "BBN_AliveHighlight" then v:Destroy() end
            end
        end
    end
})

EspPanel:AddColorPicker({
    Title = "Survivor Color",
    Description = "ปรับสีออร่าผู้รอดชีวิต",
    Default = _G.BBN_SurvivorColor,
    Callback = function(Value) _G.BBN_SurvivorColor = Value end
})

EspPanel:AddToggle({
    Title = "Killer Highlight",
    Description = "เเสดงออร่าฆาตกร",
    Default = false,
    Callback = function(Value) 
        _G.BBN_KillerHighlight = Value 
        if not Value then
            for _, v in pairs(workspace:GetDescendants()) do
                if v.Name == "BBN_KillerHighlight" then v:Destroy() end
            end
        end
    end
})

EspPanel:AddColorPicker({
    Title = "Killer Color",
    Description = "ปรับสีออร่าฆาตกร",
    Default = _G.BBN_KillerColor,
    Callback = function(Value) _G.BBN_KillerColor = Value end
})

EspPanel:AddToggle({
    Title = "Door Highlight",
    Description = "เเสดงออร่าประตู",
    Default = false,
    Callback = function(Value) 
        _G.BBN_DoorHighlight = Value 
        if not Value then
            for _, v in pairs(workspace:GetDescendants()) do
                if v.Name == "BBN_DoorHighlight" then v:Destroy() end
            end
        end
    end
})

EspPanel:AddColorPicker({
    Title = "Door Color",
    Description = "ปรับสีออร่าประตู",
    Default = _G.BBN_DoorColor,
    Callback = function(Value) _G.BBN_DoorColor = Value end
})

EspPanel:AddToggle({
    Title = "Generator Highlight",
    Description = "เเสดงออร่าเครื่องปั่นไฟ",
    Default = false,
    Callback = function(Value) 
        _G.BBN_GenHighlight = Value 
        if not Value then
            for _, v in pairs(workspace:GetDescendants()) do
                if v.Name == "BBN_GenHighlight" then
                    v:Destroy()
                end
            end
        end
    end
})

EspPanel:AddColorPicker({
    Title = "Generator Color",
    Description = "ปรับสีออร่าเครื่องปั่นไฟ",
    Default = _G.BBN_GeneratorColor,
    Callback = function(Value) _G.BBN_GeneratorColor = Value end
})

EspPanel:AddToggle({
    Title = "Generator Progress",
    Description = "แสดงเปอร์เซ็นต์ความคืบหน้าเครื่องปั่นไฟ",
    Default = false,
    Callback = function(Value) 
        _G.BBN_GenProgress = Value 
        if not Value then
            for _, v in pairs(workspace:GetDescendants()) do
                if v.Name == "BBN_GenProgressUI" then
                    v:Destroy()
                end
            end
        end
    end
})

EspPanel:AddToggle({
    Title = "Battery ESP",
    Description = "เเสดงออร่าเเบตเตอรี่ (ทั้งบนพื้นเเละในมือคน)",
    Default = false,
    Callback = function(Value) 
        _G.BBN_BatteryESP = Value 
        if not Value then
            for _, v in pairs(workspace:GetDescendants()) do
                if v.Name == "BBN_BatteryHighlight" then
                    v:Destroy()
                end
            end
        end
    end
})

EspPanel:AddColorPicker({
    Title = "Battery Color (Ground)",
    Description = "ปรับสีออร่าเเบตเตอรี่บนพื้น",
    Default = _G.BBN_BatteryColor,
    Callback = function(Value) _G.BBN_BatteryColor = Value end
})

EspPanel:AddColorPicker({
    Title = "Battery Color (Held)",
    Description = "ปรับสีออร่าเเบตเตอรี่ในมือคน",
    Default = _G.BBN_BatteryHeldColor,
    Callback = function(Value) _G.BBN_BatteryHeldColor = Value end
})

EspPanel:AddToggle({
    Title = "Trap ESP",
    Description = "เเสดงออร่ากับดัก",
    Default = false,
    Callback = function(Value) 
        _G.BBN_TrapESP = Value 
        if not Value then
            local ignore = workspace:FindFirstChild("IGNORE")
            if ignore then
                for _, obj in pairs(ignore:GetChildren()) do
                    local h = obj:FindFirstChild("BBN_TrapHighlight")
                    if h then h:Destroy() end
                end
            end
        end
    end
})

EspPanel:AddColorPicker({
    Title = "Trap Color",
    Description = "ปรับสีออร่ากับดัก",
    Default = _G.BBN_TrapColor,
    Callback = function(Value) _G.BBN_TrapColor = Value end
})


EspPanel:AddToggle({
    Title = "Minion ESP",
    Description = "เเสดงออร่ากับดักมินเนี่ยน",
    Default = false,
    Callback = function(Value) 
        _G.BBN_MinionESP = Value 
        if not Value then
            for _, v in pairs(workspace:GetDescendants()) do
                if v.Name == "BBN_MinionHighlight" then v:Destroy() end
            end
        end
    end
})

EspPanel:AddColorPicker({
    Title = "Minion Color",
    Description = "ปรับสีออร่ากับดักมินเนี่ยน",
    Default = _G.BBN_TrapColor,
    Callback = function(Value) _G.BBN_MinionColor = Value end
})

-- [[ AUTO FARM TAB content ]] --
local FarmPanel = AutoFarmTab:AddPanel("Farming")
FarmPanel:AddToggle({
    Title = "Auto Fix Generator",
    Description = "ซ่อมไฟอัตโนมัติเเละข้ามมินิเกม",
    Default = false,
    Callback = function(Value) 
        _G.BBN_AutoMinigame = Value 
    end
})

-- [[ SETTINGS TAB content ]] --
local ConfigPanel = SettingsTab:AddPanel("UI Configuration")
ConfigPanel:AddKeybind({
    Title = "Toggle UI Key",
    Default = "RightControl",
    Callback = function() end
})

ConfigPanel:AddButton({
    Title = "Destroy UI",
    Callback = function() Window:Destroy() end
})

-- [[ BACKEND LOGIC ]] --

-- CFrame Speed Logic
RunService.Stepped:Connect(function()
    if _G.CFrameSpeed then
        local char = localPlayer.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart")
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        
        if hrp and hum and hum.MoveDirection.Magnitude > 0 then
            hrp.CFrame = hrp.CFrame + (hum.MoveDirection * (_G.CFrameValue or 0.5))
        end
    end
    
    -- NoClip Logic (ถ้ายังต้องการ)
    if _G.NoClip then
        local char = localPlayer.Character
        if char then
            for _, v in pairs(char:GetDescendants()) do
                if v:IsA("BasePart") then v.CanCollide = false end
            end
        end
    end
    
    -- Infinite Stamina Logic
    if _G.BBN_InfStamina then
        local char = localPlayer.Character
        if char then
            -- ใช้ฟังก์ชันพื้นฐานของ Roblox อัดค่ากลับเป็น 100 ทันทีที่มันลดลง
            local currentStamina = char:GetAttribute("Stamina")
            if currentStamina and currentStamina < 100 then
                char:SetAttribute("Stamina", 100)
            end
        end
    end
end)

-- Infinite Jump (ถ้ายังต้องการ)
game:GetService("UserInputService").JumpRequest:Connect(function()
    if _G.InfiniteJump then
        local char = localPlayer.Character
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        if hum then
            hum:ChangeState(Enum.HumanoidStateType.Jumping)
        end
    end
end)

-- Full Bright Persistence Loop
RunService.RenderStepped:Connect(function()
    if _G.BBN_FullBright then
        pcall(function()
            Lighting.Brightness = 2
            Lighting.ClockTime = 14
            Lighting.FogEnd = 100000
            Lighting.GlobalShadows = false
            Lighting.Ambient = Color3.fromRGB(255, 255, 255)
            Lighting.OutdoorAmbient = Color3.fromRGB(255, 255, 255)
            Lighting.ColorShift_Bottom = Color3.fromRGB(255, 255, 255)
            Lighting.ColorShift_Top = Color3.fromRGB(255, 255, 255)
            
            -- Override specific map elements safely
            for _, v in pairs(Lighting:GetChildren()) do
                if v:IsA("Atmosphere") then
                    v.Density = 0
                elseif v:IsA("PostEffect") then
                    v.Enabled = false
                end
            end
        end)
    end
end)

-- Helper: Optimized Generators Folder Cache
local cachedGensFolder = nil
local function GetGeneratorsFolder()
    if cachedGensFolder and cachedGensFolder.Parent then return cachedGensFolder end
    
    local maps = workspace:FindFirstChild("MAPS")
    local gameMap = maps and maps:FindFirstChild("GAME MAP")
    local gens = gameMap and gameMap:FindFirstChild("Generators")
    
    if gens then 
        cachedGensFolder = gens
        return gens 
    end
    
    -- Slower fallback (but we cache it now)
    for _, v in pairs(workspace:GetChildren()) do
        if v.Name == "Generators" then
            cachedGensFolder = v
            return v
        end
    end
    return nil
end

-- Helper: Find Doors Folder
local function GetDoorsFolder()
    local maps = workspace:FindFirstChild("MAPS")
    local gameMap = maps and maps:FindFirstChild("GAME MAP")
    local doors = gameMap and gameMap:FindFirstChild("Doors")
    
    if doors then return doors end
    
    for _, v in pairs(workspace:GetDescendants()) do
        if v.Name == "Doors" and (v:IsA("Folder") or v:IsA("Model")) then
            return v
        end
    end
    return nil
end

-- Generator ESP Loop
task.spawn(function()
    while true do
        if _G.BBN_GenHighlight or _G.BBN_GenProgress then
            local gensFolder = GetGeneratorsFolder()
            if gensFolder then
                for _, gen in pairs(gensFolder:GetChildren()) do
                    if gen.Name == "Generator" then
                        local hrp = gen:FindFirstChild("HumanoidRootPart")
                        if hrp then
                            -- 1. Highlight (Chams)
                            if _G.BBN_GenHighlight then
                                local highlight = gen:FindFirstChild("BBN_GenHighlight")
                                if not highlight then
                                    highlight = Instance.new("Highlight")
                                    highlight.Name = "BBN_GenHighlight"
                                    highlight.OutlineColor = Color3.fromRGB(255, 255, 255)
                                    highlight.FillTransparency = 0.5
                                    highlight.OutlineTransparency = 0
                                    highlight.Adornee = gen
                                    highlight.Parent = gen
                                end
                                highlight.FillColor = _G.BBN_GeneratorColor or Color3.fromRGB(225, 0, 255)
                            else
                                local h = gen:FindFirstChild("BBN_GenHighlight")
                                if h then h:Destroy() end
                            end
                            
                            -- 2. Billboard (Progress %)
                            if _G.BBN_GenProgress then
                                local billboard = hrp:FindFirstChild("BBN_GenProgressUI")
                                if not billboard then
                                    billboard = Instance.new("BillboardGui")
                                    billboard.Name = "BBN_GenProgressUI"
                                    billboard.AlwaysOnTop = true
                                    billboard.Size = UDim2.new(0, 80, 0, 40)
                                    billboard.StudsOffset = Vector3.new(0, 3, 0)
                                    billboard.Parent = hrp
                                    
                                    local label = Instance.new("TextLabel")
                                    label.Size = UDim2.new(1, 0, 1, 0)
                                    label.BackgroundTransparency = 1
                                    label.TextStrokeTransparency = 0
                                    label.Font = Enum.Font.SourceSansBold
                                    label.TextScaled = true
                                    label.Parent = billboard
                                end
                                billboard.TextLabel.TextColor3 = _G.BBN_GeneratorColor or Color3.fromRGB(225, 0, 255)
                                
                                -- Update Text
                                local progress = gen:GetAttribute("Progress") or 0
                                billboard.TextLabel.Text = string.format("[%d%%]", math.floor(progress))
                            else
                                local e = hrp:FindFirstChild("BBN_GenProgressUI")
                                if e then e:Destroy() end
                            end
                        end
                    end
                end
            end
        end
        task.wait(1) -- Slightly slower ESP loop is better for performance
    end
end)

-- Player ESP Loop
task.spawn(function()
    while true do
        local playersFolder = workspace:FindFirstChild("PLAYERS")
        if playersFolder then
            -- ALIVE ESP
            local aliveFolder = playersFolder:FindFirstChild("ALIVE")
            if aliveFolder then
                for _, char in pairs(aliveFolder:GetChildren()) do
                    if char:IsA("Model") and char:FindFirstChild("HumanoidRootPart") then
                        if _G.BBN_AliveHighlight then
                            local h = char:FindFirstChild("BBN_AliveHighlight")
                            if not h and char ~= localPlayer.Character then
                                h = Instance.new("Highlight")
                                h.Name = "BBN_AliveHighlight"
                                h.OutlineColor = Color3.fromRGB(255, 255, 255)
                                h.FillTransparency = 0.5
                                h.OutlineTransparency = 0
                                h.Adornee = char
                                h.Parent = char
                            end
                            if h then h.FillColor = _G.BBN_SurvivorColor end
                        else
                            local h = char:FindFirstChild("BBN_AliveHighlight")
                            if h then h:Destroy() end
                        end
                    end
                end
            end

            -- KILLER ESP
            local killerFolder = playersFolder:FindFirstChild("KILLER")
            if killerFolder then
                for _, char in pairs(killerFolder:GetChildren()) do
                    if char:IsA("Model") and char:FindFirstChild("HumanoidRootPart") then
                        if _G.BBN_KillerHighlight then
                            local h = char:FindFirstChild("BBN_KillerHighlight")
                            if not h and char ~= localPlayer.Character then
                                h = Instance.new("Highlight")
                                h.Name = "BBN_KillerHighlight"
                                h.OutlineColor = Color3.fromRGB(255, 255, 255)
                                h.FillTransparency = 0.5
                                h.OutlineTransparency = 0
                                h.Adornee = char
                                h.Parent = char
                            end
                            if h then h.FillColor = _G.BBN_KillerColor end
                        else
                            local h = char:FindFirstChild("BBN_KillerHighlight")
                            if h then h:Destroy() end
                        end
                    end
                end
            end
        end
        task.wait(0.5)
    end
end)

-- Door ESP Loop
task.spawn(function()
    while true do
        if _G.BBN_DoorHighlight then
            pcall(function()
                local doors = GetDoorsFolder()
                if doors then
                    for _, door in pairs(doors:GetDescendants()) do
                        if door:IsA("Model") and (door.Name == "Door" or door:FindFirstChild("DoorPanel")) then
                            local h = door:FindFirstChild("BBN_DoorHighlight")
                            if not h then
                                h = Instance.new("Highlight")
                                h.Name = "BBN_DoorHighlight"
                                h.OutlineColor = Color3.fromRGB(255, 255, 255)
                                h.FillTransparency = 0.5
                                h.OutlineTransparency = 0
                                h.Adornee = door
                                h.Parent = door
                            end
                            h.FillColor = _G.BBN_DoorColor
                        end
                    end
                end
            end)
        end
        task.wait(2) -- Doors don't move, so a slow loop is fine
    end
end)

-- Battery ESP Loop
local lastBatteryMapScan = 0
task.spawn(function()
    while true do
        if _G.BBN_BatteryESP then
            pcall(function()
                -- 1. Batteries in IGNORE (Dropped batteries)
                local ignore = workspace:FindFirstChild("IGNORE")
                if ignore then
                    for _, bat in pairs(ignore:GetChildren()) do
                        if bat.Name == "Battery" and (bat:IsA("BasePart") or bat:IsA("Model")) then
                            local h = bat:FindFirstChild("BBN_BatteryHighlight")
                            if not h then
                                h = Instance.new("Highlight")
                                h.Name = "BBN_BatteryHighlight"
                                h.OutlineColor = Color3.fromRGB(255, 255, 255)
                                h.FillTransparency = 0.5
                                h.OutlineTransparency = 0
                                h.Adornee = bat
                                h.Parent = bat
                            end
                            h.FillColor = _G.BBN_BatteryColor
                        end
                    end
                end
                
                -- 2. Batteries in MAPS (Initial batteries in FuseBoxes) - Periodic scan to prevent lag
                if tick() - lastBatteryMapScan > 3 then
                    lastBatteryMapScan = tick()
                    local maps = workspace:FindFirstChild("MAPS")
                    if maps then
                        for _, v in pairs(maps:GetDescendants()) do
                            if v.Name == "Battery" and (v:IsA("BasePart") or v:IsA("Model")) then
                                -- Skip batteries that are already in a FuseBox
                                if v:FindFirstAncestor("FuseBox") then continue end
                                
                                local h = v:FindFirstChild("BBN_BatteryHighlight")
                                if not h then
                                    h = Instance.new("Highlight")
                                    h.Name = "BBN_BatteryHighlight"
                                    h.OutlineColor = Color3.fromRGB(255, 255, 255)
                                    h.FillTransparency = 0.5
                                    h.OutlineTransparency = 0
                                    h.Adornee = v
                                    h.Parent = v
                                end
                                h.FillColor = _G.BBN_BatteryColor
                            end
                        end
                    end
                end
                
                -- 3. Batteries in hands
                local playersFolder = workspace:FindFirstChild("PLAYERS")
                local alive = playersFolder and playersFolder:FindFirstChild("ALIVE")
                if alive then
                    for _, char in pairs(alive:GetChildren()) do
                        if char ~= localPlayer.Character then
                            local battery = char:FindFirstChild("Battery")
                            if battery and (battery:IsA("BasePart") or battery:IsA("Model")) then
                                local h = battery:FindFirstChild("BBN_BatteryHighlight")
                                if not h then
                                    h = Instance.new("Highlight")
                                    h.Name = "BBN_BatteryHighlight"
                                    h.OutlineColor = Color3.fromRGB(255, 255, 255)
                                    h.FillTransparency = 0.4
                                    h.OutlineTransparency = 0
                                    h.Adornee = battery
                                    h.Parent = battery
                                end
                                h.FillColor = _G.BBN_BatteryHeldColor
                            end
                        end
                    end
                end
            end)
        end
        task.wait(1)
    end
end)

-- Trap ESP Loop
task.spawn(function()
    while true do
        if _G.BBN_TrapESP then
            pcall(function()
                local ignore = workspace:FindFirstChild("IGNORE")
                if ignore then
                    for _, obj in pairs(ignore:GetChildren()) do
                        if obj.Name == "Trap" then
                            local h = obj:FindFirstChild("BBN_TrapHighlight")
                            if not h then
                                h = Instance.new("Highlight")
                                h.Name = "BBN_TrapHighlight"
                                h.OutlineColor = Color3.fromRGB(255, 255, 255)
                                h.FillTransparency = 0.5
                                h.OutlineTransparency = 0
                                h.Adornee = obj
                                h.Parent = obj
                            end
                            h.FillColor = _G.BBN_TrapColor
                        end
                    end
                end
            end)
        end
        task.wait(1.5) -- Traps don't move, so a slower loop is fine
    end
end)

-- Minion ESP Loop
task.spawn(function()
    while true do
        if _G.BBN_MinionESP then
            pcall(function()
                for _, obj in pairs(workspace:GetDescendants()) do
                    if obj.Name == "Minion" and obj:IsA("Model") then
                        local h = obj:FindFirstChild("BBN_MinionHighlight")
                        if not h then
                            h = Instance.new("Highlight")
                            h.Name = "BBN_MinionHighlight"
                            h.OutlineColor = Color3.fromRGB(255, 255, 255)
                            h.FillTransparency = 0.5
                            h.OutlineTransparency = 0
                            h.Adornee = obj
                            h.Parent = obj
                        end
                        h.FillColor = _G.BBN_MinionColor or Color3.fromRGB(255, 0, 0)
                    end
                end
            end)
        end
        task.wait(1.5)
    end
end)

-- [[ Event-Driven Auto Minigame (Zero Lag) ]] --
local function RunAutoFixLogic(genUI)
    task.spawn(function()
        local targetGen = nil
        local hrp = localPlayer.Character and localPlayer.Character:FindFirstChild("HumanoidRootPart")
        local gens = GetGeneratorsFolder()
        
        -- Identify target generator once when UI opens
        if hrp and gens then
            for _, gen in pairs(gens:GetChildren()) do
                if gen.Name == "Generator" then
                    local ghrp = gen:FindFirstChild("HumanoidRootPart")
                    if ghrp and (hrp.Position - ghrp.Position).Magnitude < 20 then
                        targetGen = gen
                        break
                    end
                end
            end
        end

        -- Active loop ONLY while UI exists
        while genUI and genUI.Parent and _G.BBN_AutoMinigame do
            local event = genUI:FindFirstChild("Event")
            if event and event:IsA("RemoteEvent") then
                event:FireServer({
                    ["Lever"] = true, ["Switches"] = true, ["Wires"] = true,
                    ["Fuel"] = true, ["Valve"] = true, ["Cogs"] = true
                })
            end
            
            local progress = targetGen and targetGen:GetAttribute("Progress") or 0
            if progress >= 100 then
                local screenGui = genUI:FindFirstAncestorOfClass("ScreenGui")
                if screenGui then screenGui:Destroy() end
                break
            end
            task.wait(0.1)
        end
    end)
end

-- Setup Listeners
task.spawn(function()
    local playerGui = localPlayer:WaitForChild("PlayerGui")
    
    -- 1. Event-driven detection (Zero lag)
    playerGui.DescendantAdded:Connect(function(desc)
        if _G.BBN_AutoMinigame and desc.Name == "GeneratorMain" then
            RunAutoFixLogic(desc)
        end
    end)
    
    -- 2. Slow Polling Fallback (Runs every 2s, very light)
    while true do
        if _G.BBN_AutoMinigame then
            -- Check PlayerGui
            local existingUI = playerGui:FindFirstChild("GeneratorMain", true)
            if existingUI then
                RunAutoFixLogic(existingUI)
                -- Wait for UI to close before checking again to prevent multiple threads
                repeat task.wait(1) until not existingUI or not existingUI.Parent or not _G.BBN_AutoMinigame
            end
            
            -- Check Nil (Only if really needed, every 5s)
            if _G.BBN_AutoMinigame and getnilinstances then
                for _, obj in pairs(getnilinstances()) do
                    if obj.Name == "GeneratorMain" then
                        RunAutoFixLogic(obj)
                        repeat task.wait(1) until not obj or not obj.Parent or not _G.BBN_AutoMinigame
                        break
                    end
                end
            end
        end
        task.wait(2)
    end
end)

print("[OSX HUB] Full Bright, CFrame, Gen, Player, Door ESP & Auto Minigame Configured.")
