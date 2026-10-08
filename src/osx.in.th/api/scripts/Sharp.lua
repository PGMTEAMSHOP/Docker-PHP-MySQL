-- [[ Sharp | OSX HUB ]] --
local success, OSX = pcall(function()
    -- Attempt to load local dev file first (for developers)
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success or not OSX then
    -- Fallback to Github version
    OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
end

-- Fetch Game Name
local successName, productInfo = pcall(function()
    return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
end)
local GameName = successName and productInfo and productInfo.Name or "Sharp"

-- Window Setup
local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- Services
local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- CombatClient & BackpackClient loading
local CombatClient = nil
local BackpackClient = nil
pcall(function()
    CombatClient = require(ReplicatedStorage:WaitForChild("Client"):WaitForChild("Madwork"):WaitForChild("CombatClient"))
    BackpackClient = require(ReplicatedStorage:WaitForChild("Client"):WaitForChild("Madwork"):WaitForChild("BackpackClient"))
end)

local lastActionData = nil
local lastToolId = nil
local oldNewLocalEvent = nil

if CombatClient then
    oldNewLocalEvent = CombatClient.NewLocalEvent
    CombatClient.NewLocalEvent = function(actionData)
        if actionData then
            if not lastActionData then
                pcall(function()
                    OSX:Notify({
                        Title = "Auto Attack",
                        Content = "บันทึกข้อมูลมีดเรียบร้อย! เริ่มทำงานปาอัตโนมัติ",
                        Type = "Success"
                    })
                end)
            end
            lastActionData = actionData
            if actionData.ToolId then
                lastToolId = actionData.ToolId
            end
        end
        return oldNewLocalEvent(actionData)
    end
end

-- ESP Configuration
local ESP_Settings = {
    Boxes = false,
    Names = false,
    Tracers = false,
    TeamCheck = false,
    BoxColor = Color3.fromRGB(0, 255, 120),
    NameColor = Color3.fromRGB(255, 255, 255),
    TracerColor = Color3.fromRGB(255, 0, 0),
    BoxTransparency = 0.6,
    TextSize = 12
}

-- Hitbox Configuration
local Hitbox_Settings = {
    Enabled = false,
    Size = 10,
    Transparency = 0.7,
    Part = "HumanoidRootPart"
}

local HitboxCache = {}

local function ApplyHitbox(char)
    if not Hitbox_Settings.Enabled then return end
    local part = char:FindFirstChild(Hitbox_Settings.Part)
    if part and part:IsA("BasePart") then
        if not HitboxCache[char] then
            HitboxCache[char] = {
                Size = part.Size,
                Transparency = part.Transparency,
                CanCollide = part.CanCollide
            }
        end
        part.Size = Vector3.new(Hitbox_Settings.Size, Hitbox_Settings.Size, Hitbox_Settings.Size)
        part.Transparency = Hitbox_Settings.Transparency
        part.CanCollide = false
    end
end

local function ResetHitbox(char)
    if HitboxCache[char] then
        local part = char:FindFirstChild(Hitbox_Settings.Part)
        if part and part:IsA("BasePart") then
            part.Size = HitboxCache[char].Size
            part.Transparency = HitboxCache[char].Transparency
            part.CanCollide = HitboxCache[char].CanCollide
        end
        HitboxCache[char] = nil
    end
end

local function UpdateHitbox()
    for _, player in pairs(Players:GetPlayers()) do
        local char = player.Character
        if char and char ~= Players.LocalPlayer.Character then
            if Hitbox_Settings.Enabled then
                ApplyHitbox(char)
            else
                ResetHitbox(char)
            end
        end
    end
end

-- Aimbot Configuration
local Aimbot_Settings = {
    Enabled = false,
    Method = "Camera Lock", 
    AimPart = "Head", 
    FOV = 200, 
    Smoothness = 0.2, 
    Key = "Always Active", 
    ShowFOV = true 
}

-- Auto Attack Configuration
local AutoAttack_Settings = {
    Enabled = false,
    Delay = 0.5
}

-- ESP & Aimbot Storage
local EspObjects = {}
local CharacterConnections = {}
local FolderConnections = {}
local TeamConnections = {}
local isAiming = false
local currentTarget = nil

-- FOV Circle Drawing
local FOVCircle = nil
pcall(function()
    FOVCircle = Drawing.new("Circle")
    FOVCircle.Color = Color3.fromRGB(255, 60, 60)
    FOVCircle.Thickness = 1.5
    FOVCircle.Filled = false
    FOVCircle.Transparency = 0.8
    FOVCircle.Visible = false
end)

-- Helper function to check if character belongs to teammate
local function isTeammate(char)
    local player = Players:GetPlayerFromCharacter(char) or Players:FindFirstChild(char.Name)
    if player and player ~= Players.LocalPlayer then
        if player.Neutral then
            return false
        end
        if player.Team and Players.LocalPlayer.Team and player.Team == Players.LocalPlayer.Team then
            if player.Team.Name ~= "Neutral" then
                return true
            end
        end
    end
    return false
end

-- Clean up individual ESP
local function RemoveESP(char)
    if EspObjects[char] then
        pcall(function()
            for _, obj in pairs(EspObjects[char]) do
                obj:Destroy()
            end
        end)
        EspObjects[char] = nil
    end
end

-- Create ESP for a Character
local function ApplyESP(char)
    if not char:IsA("Model") then return end
    if char == Players.LocalPlayer.Character then return end
    
    RemoveESP(char)
    
    if ESP_Settings.TeamCheck and isTeammate(char) then
        return
    end
    
    local objects = {}
    local hrp = char:WaitForChild("HumanoidRootPart", 5) or char.PrimaryPart or char:FindFirstChildWhichIsA("BasePart")
    local humanoid = char:FindFirstChildWhichIsA("Humanoid")
    
    if not hrp then return end
    
    -- 1. Box ESP (using BoxHandleAdornment for each Part)
    if ESP_Settings.Boxes then
        for _, part in pairs(char:GetChildren()) do
            if part:IsA("BasePart") and part.Name ~= "HumanoidRootPart" then
                local box = Instance.new("BoxHandleAdornment")
                box.Name = "OSX_ESP_Box"
                box.Size = part.Size
                box.Adornee = part
                box.AlwaysOnTop = true
                box.ZIndex = 5
                box.Color3 = ESP_Settings.BoxColor
                box.Transparency = ESP_Settings.BoxTransparency
                box.Parent = part
                table.insert(objects, box)
            end
        end
    end
    
    -- 2. Name & Distance ESP (using BillboardGui)
    if ESP_Settings.Names then
        local head = char:FindFirstChild("Head") or hrp
        if head then
            local billboard = Instance.new("BillboardGui")
            billboard.Name = "OSX_ESP_Billboard"
            billboard.Size = UDim2.new(0, 150, 0, 30)
            billboard.AlwaysOnTop = true
            billboard.Parent = head
            billboard.Adornee = head
            billboard.StudsOffset = Vector3.new(0, 2.5, 0)
            
            local label = Instance.new("TextLabel")
            label.Size = UDim2.new(1, 0, 1, 0)
            label.BackgroundTransparency = 1
            label.TextColor3 = ESP_Settings.NameColor
            label.TextSize = ESP_Settings.TextSize
            label.Font = Enum.Font.SourceSansBold
            label.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
            label.TextStrokeTransparency = 0.2
            label.Parent = billboard
            
            table.insert(objects, billboard)
            
            local updateConn
            updateConn = RunService.RenderStepped:Connect(function()
                if not char.Parent or not billboard.Parent or not ESP_Settings.Names then
                    updateConn:Disconnect()
                    return
                end
                
                if ESP_Settings.TeamCheck and isTeammate(char) then
                    RemoveESP(char)
                    updateConn:Disconnect()
                    return
                end
                
                local localChar = Players.LocalPlayer.Character
                local localHrp = localChar and (localChar.PrimaryPart or localChar:FindFirstChild("HumanoidRootPart"))
                local distanceStr = ""
                
                if localHrp and hrp then
                    local distance = math.floor((localHrp.Position - hrp.Position).Magnitude)
                    distanceStr = " [" .. tostring(distance) .. "m]"
                end
                
                local hpStr = ""
                if humanoid then
                    hpStr = " (" .. math.floor(humanoid.Health) .. " HP)"
                end
                
                label.Text = char.Name .. distanceStr .. hpStr
            end)
            
            table.insert(objects, {
                Destroy = function()
                    pcall(function() updateConn:Disconnect() end)
                    pcall(function() billboard:Destroy() end)
                end
            })
        end
    end
    
    -- 3. Tracer ESP (using LineHandleAdornment)
    if ESP_Settings.Tracers then
        local tracer = Instance.new("LineHandleAdornment")
        tracer.Name = "OSX_ESP_Tracer"
        tracer.Length = 0
        tracer.Thickness = 2
        tracer.AlwaysOnTop = true
        tracer.ZIndex = 5
        tracer.Color3 = ESP_Settings.TracerColor
        tracer.Transparency = 0.3
        tracer.Parent = hrp
        
        table.insert(objects, tracer)
        
        local tracerConn
        tracerConn = RunService.RenderStepped:Connect(function()
            if not char.Parent or not tracer.Parent or not ESP_Settings.Tracers then
                tracerConn:Disconnect()
                return
            end
            
            if ESP_Settings.TeamCheck and isTeammate(char) then
                RemoveESP(char)
                tracerConn:Disconnect()
                return
            end
            
            local localChar = Players.LocalPlayer.Character
            local localHrp = localChar and (localChar.PrimaryPart or localChar:FindFirstChild("HumanoidRootPart"))
            if localHrp and hrp then
                tracer.Adornee = localHrp
                local relativePos = localHrp.CFrame:PointToObjectSpace(hrp.Position)
                tracer.CFrame = CFrame.new(Vector3.zero, relativePos)
                tracer.Length = relativePos.Magnitude
            else
                tracer.Adornee = nil
            end
        end)
        
        table.insert(objects, {
            Destroy = function()
                pcall(function() tracerConn:Disconnect() end)
                pcall(function() tracer:Destroy() end)
            end
        })
    end
    
    EspObjects[char] = objects
end

-- Update all characters ESP
local function UpdateESP()
    for _, player in pairs(Players:GetPlayers()) do
        local char = player.Character
        if char and char ~= Players.LocalPlayer.Character then
            if ESP_Settings.Boxes or ESP_Settings.Names or ESP_Settings.Tracers then
                ApplyESP(char)
            else
                RemoveESP(char)
            end
        end
    end
end

-- Target acquisition function for Aimbot (using Mouse position as reference)
local function GetClosestTarget()
    local closestTarget = nil
    local shortestDistance = math.huge
    local localPlayer = Players.LocalPlayer
    local camera = Workspace.CurrentCamera
    local Mouse = localPlayer:GetMouse()
    local referencePoint = Vector2.new(Mouse.X, Mouse.Y)
    
    for _, player in pairs(Players:GetPlayers()) do
        local char = player.Character
        if char and char:IsA("Model") and player ~= localPlayer then
            if ESP_Settings.TeamCheck and isTeammate(char) then
                continue
            end
            
            local hrp = char:FindFirstChild("HumanoidRootPart") or char.PrimaryPart or char:FindFirstChildWhichIsA("BasePart")
            local targetPart = char:FindFirstChild(Aimbot_Settings.AimPart) or hrp
            local humanoid = char:FindFirstChildWhichIsA("Humanoid")
            
            -- Ensure target is alive
            if targetPart and (not humanoid or humanoid.Health > 0) then
                local screenPos, onScreen = camera:WorldToViewportPoint(targetPart.Position)
                if onScreen then -- Must be on screen to lock
                    local distToRef = (Vector2.new(screenPos.X, screenPos.Y) - referencePoint).Magnitude
                    if distToRef < shortestDistance and distToRef <= Aimbot_Settings.FOV then
                        shortestDistance = distToRef
                        closestTarget = targetPart
                    end
                end
            end
        end
    end
    
    return closestTarget
end

-- Check if Aim Key is held or if set to Always Active
local function checkAimActive()
    if AutoAttack_Settings.Enabled then
        return true
    end
    if Aimbot_Settings.Key == "Always Active" then
        return true
    end
    return isAiming
end

-- Screen position of the current target (for 2D mouse position redirection)
local function getTargetScreenPos()
    if currentTarget then
        local camera = Workspace.CurrentCamera
        local screenPos, onScreen = camera:WorldToViewportPoint(currentTarget.Position)
        if onScreen then
            return Vector2.new(screenPos.X, screenPos.Y)
        end
    end
    return nil
end

-- Render loop for FOV Circle & Aimbot target acquisition
RunService.RenderStepped:Connect(function()
    local camera = Workspace.CurrentCamera
    local Mouse = Players.LocalPlayer:GetMouse()
    local referencePoint = Vector2.new(Mouse.X, Mouse.Y)
    
    -- Update FOV Circle to follow the Mouse cursor
    if FOVCircle then
        FOVCircle.Position = referencePoint
        FOVCircle.Radius = Aimbot_Settings.FOV
        FOVCircle.Visible = Aimbot_Settings.Enabled and Aimbot_Settings.ShowFOV
    end
    
    if Aimbot_Settings.Enabled or AutoAttack_Settings.Enabled then
        currentTarget = GetClosestTarget()
    else
        currentTarget = nil
    end
end)

-- Camera Lock execution (Runs after Roblox CameraScript updates)
RunService:BindToRenderStep("OSX_CameraLock", Enum.RenderPriority.Camera.Value + 1, function()
    if Aimbot_Settings.Enabled and currentTarget and Aimbot_Settings.Method == "Camera Lock" and checkAimActive() then
        local camera = Workspace.CurrentCamera
        local targetCFrame = CFrame.new(camera.CFrame.Position, currentTarget.Position)
        camera.CFrame = camera.CFrame:Lerp(targetCFrame, Aimbot_Settings.Smoothness)
    end
end)

-- Auto Attack Loop
task.spawn(function()
    while task.wait() do
        if AutoAttack_Settings.Enabled and currentTarget then
            if lastActionData and CombatClient then
                local char = Players.LocalPlayer.Character
                local hasToolEquipped = char and char:FindFirstChildWhichIsA("Tool")
                if hasToolEquipped then
                    pcall(function()
                        CombatClient.NewLocalEvent(lastActionData)
                    end)
                    task.wait(AutoAttack_Settings.Delay)
                end
            end
        end
    end
end)

-- Mobile and Universal Keybind listeners
UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    
    -- Handle Keyboard keys
    if Aimbot_Settings.Key == "E Key" and input.KeyCode == Enum.KeyCode.E then
        isAiming = true
    elseif Aimbot_Settings.Key == "Left Shift" and input.KeyCode == Enum.KeyCode.LeftShift then
        isAiming = true
    -- Handle Mouse buttons
    elseif Aimbot_Settings.Key == "Right Click" and input.UserInputType == Enum.UserInputType.MouseButton2 then
        isAiming = true
    -- Mobile / Touch inputs
    elseif input.UserInputType == Enum.UserInputType.Touch then
        isAiming = true
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if Aimbot_Settings.Key == "E Key" and input.KeyCode == Enum.KeyCode.E then
        isAiming = false
    elseif Aimbot_Settings.Key == "Left Shift" and input.KeyCode == Enum.KeyCode.LeftShift then
        isAiming = false
    elseif Aimbot_Settings.Key == "Right Click" and input.UserInputType == Enum.UserInputType.MouseButton2 then
        isAiming = false
    elseif input.UserInputType == Enum.UserInputType.Touch then
        isAiming = false
    end
end)

-- Silent Aim Hook: Hook Mouse, UserInputService, and Camera
local Mouse = Players.LocalPlayer:GetMouse()
local successHook, err = pcall(function()
    local gmt = getrawmetatable(game)
    if gmt then
        local oldIndex = gmt.__index
        local oldNamecall = gmt.__namecall
        setreadonly(gmt, false)
        
        -- Hook Mouse indexing (Hit, Target, X, Y)
        gmt.__index = newcclosure(function(self, index)
            if not checkcaller() and (Aimbot_Settings.Enabled or AutoAttack_Settings.Enabled) and checkAimActive() and currentTarget then
                if self == Mouse then
                    if index == "Hit" then
                        return currentTarget.CFrame
                    elseif index == "Target" then
                        return currentTarget
                    elseif index == "X" then
                        local sPos = getTargetScreenPos()
                        if sPos then return sPos.X end
                    elseif index == "Y" then
                        local sPos = getTargetScreenPos()
                        if sPos then return sPos.Y end
                    end
                end
            end
            return oldIndex(self, index)
        end)
        
        -- Hook Namecalls (GetMouseLocation, ViewportPointToRay, ScreenPointToRay, and generic Raycasts)
        gmt.__namecall = newcclosure(function(self, ...)
            local method = getnamecallmethod()
            local args = {...}
            
            if not checkcaller() then
                -- Intercept and redirect Knife throws and hits for MadworkCombat (MM2 style)
                if method == "FireServer" then
                    if self.Name == "MadworkCombat_CombatEvent" then
                        if (Aimbot_Settings.Enabled or AutoAttack_Settings.Enabled) and checkAimActive() and currentTarget then
                            local combatData = args[1]
                            if type(combatData) == "table" then
                                local startPos = combatData[5]
                                if startPos then
                                    local targetPos = currentTarget.Position
                                    local dir = (targetPos - startPos).Unit
                                    combatData[4] = dir
                                end
                            end
                        end
                    elseif self.Name == "MadworkCombat_CombatUpdate" then
                        if (Aimbot_Settings.Enabled or AutoAttack_Settings.Enabled) and checkAimActive() and currentTarget then
                            local updateData = args[1]
                            if type(updateData) == "table" then
                                local hitInfo = updateData[2]
                                if type(hitInfo) == "table" then
                                    hitInfo[4] = currentTarget -- Hit Part (MeshPart/BasePart)
                                    hitInfo[5] = currentTarget.Name -- Hit Part Name (e.g. UpperTorso/Head)
                                    hitInfo[6] = currentTarget.Position -- Hit Position
                                end
                            end
                        end
                    end
                end
                
                if (Aimbot_Settings.Enabled or AutoAttack_Settings.Enabled) and checkAimActive() and currentTarget then
                    -- Hook UserInputService:GetMouseLocation() - used heavily by mobile and custom mouse scripts
                    if self == UserInputService and method == "GetMouseLocation" then
                        local sPos = getTargetScreenPos()
                        if sPos then
                            return sPos
                        end
                    end
                    
                    -- Hook Camera Ray projections (converts 2D mouse position to 3D world direction)
                    if self == Workspace.CurrentCamera and (method == "ViewportPointToRay" or method == "ScreenPointToRay") then
                        local origin = Workspace.CurrentCamera.CFrame.Position
                        local direction = (currentTarget.Position - origin).Unit
                        return Ray.new(origin, direction)
                    end
                    
                    -- Hook standard Raycasting redirection
                    if method == "FindPartOnRay" or method == "FindPartOnRayWithIgnoreList" or method == "FindPartOnRayWithWhitelist" then
                        return currentTarget, currentTarget.Position, Vector3.new(0, 1, 0), currentTarget.Material
                    elseif method == "Raycast" and self == Workspace then
                        local origin = args[1]
                        local direction = (currentTarget.Position - origin).Unit * 1000
                        args[2] = direction
                        return oldNamecall(self, table.unpack(args))
                    end
                end
            end
            return oldNamecall(self, ...)
        end)
        
        setreadonly(gmt, true)
    end
end)

-- Setup listener for player team changes to refresh ESP automatically
local function setupTeamListener(player)
    if TeamConnections[player] then
        pcall(function() TeamConnections[player]:Disconnect() end)
    end
    TeamConnections[player] = player:GetPropertyChangedSignal("Team"):Connect(function()
        task.wait(0.1)
        UpdateESP()
    end)
end

-- Refresh and monitor Characters Folder
local function MonitorCharactersFolder()
    if FolderConnections.PlayerAdded then FolderConnections.PlayerAdded:Disconnect() end
    if FolderConnections.PlayerRemoving then FolderConnections.PlayerRemoving:Disconnect() end
    
    for _, conn in pairs(CharacterConnections) do
        if type(conn) == "userdata" and typeof(conn) == "RBXScriptConnection" then
            pcall(function() conn:Disconnect() end)
        end
    end
    table.clear(CharacterConnections)

    for _, player in pairs(Players:GetPlayers()) do
        setupTeamListener(player)
        if player ~= Players.LocalPlayer then
            if player.Character then
                ApplyESP(player.Character)
                if Hitbox_Settings.Enabled then ApplyHitbox(player.Character) end
            end
            CharacterConnections[player.Name] = player.CharacterAdded:Connect(function(char)
                task.wait(0.1)
                ApplyESP(char)
                if Hitbox_Settings.Enabled then 
                    task.wait(0.1)
                    ApplyHitbox(char) 
                end
            end)
        end
    end

    FolderConnections.PlayerAdded = Players.PlayerAdded:Connect(function(player)
        setupTeamListener(player)
        CharacterConnections[player.Name] = player.CharacterAdded:Connect(function(char)
            task.wait(0.1)
            ApplyESP(char)
            if Hitbox_Settings.Enabled then 
                task.wait(0.1)
                ApplyHitbox(char) 
            end
        end)
    end)
    
    FolderConnections.PlayerRemoving = Players.PlayerRemoving:Connect(function(player)
        if TeamConnections[player] then
            pcall(function() TeamConnections[player]:Disconnect() end)
            TeamConnections[player] = nil
        end
        if CharacterConnections[player.Name] then
            pcall(function() CharacterConnections[player.Name]:Disconnect() end)
            CharacterConnections[player.Name] = nil
        end
        if player.Character then
            RemoveESP(player.Character)
            ResetHitbox(player.Character)
        end
    end)
end

-- Stop ESP Completely
local function StopESP()
    if FolderConnections.PlayerAdded then FolderConnections.PlayerAdded:Disconnect() end
    if FolderConnections.PlayerRemoving then FolderConnections.PlayerRemoving:Disconnect() end
    
    for player, conn in pairs(TeamConnections) do
        pcall(function() conn:Disconnect() end)
    end
    table.clear(TeamConnections)
    
    for _, conn in pairs(CharacterConnections) do
        if type(conn) == "userdata" and typeof(conn) == "RBXScriptConnection" then
            pcall(function() conn:Disconnect() end)
        end
    end
    table.clear(CharacterConnections)
    
    for char, _ in pairs(EspObjects) do
        RemoveESP(char)
    end
    table.clear(EspObjects)

    for char, _ in pairs(HitboxCache) do
        ResetHitbox(char)
    end
    table.clear(HitboxCache)
end

-- ==========================================
-- Info Tab
-- ==========================================
local InfoTab = Window:AddTab({ Title = "Info", SubDescription = "Information & Socials", Icon = "info" })
local InfoPanel = InfoTab:AddPanel("Information")
InfoPanel:AddInfoLabel("Developer:", "LilYouDev1997")
InfoPanel:AddInfoLabel("Discord:", "discord.gg/osxhub")
InfoPanel:AddWideButton({
    Title = "Copy Discord Link",
    Callback = function()
        pcall(function()
            setclipboard("https://discord.gg/osxhub")
        end)
    end
})

-- ==========================================
-- Combat Tab
-- ==========================================
local CombatTab = Window:AddTab({ Title = "Combat", SubDescription = "Aimbot & Knives", Icon = "zap" })
local AimbotPanel = CombatTab:AddPanel("Knife Aimbot Settings")

AimbotPanel:AddToggle({
    Title = "Aimbot Enabled",
    Description = "เปิด/ปิด ระบบช่วยล็อคเป้า",
    Default = false,
    Callback = function(Value)
        Aimbot_Settings.Enabled = Value
    end
})

AimbotPanel:AddToggle({
    Title = "Auto Attack Enabled",
    Description = "โจมตี/ปามีดอัตโนมัติ (กรุณาปามีดเองก่อน 1 ครั้งในตาแรกเพื่อให้สคริปต์จำข้อมูล)",
    Default = false,
    Callback = function(Value)
        AutoAttack_Settings.Enabled = Value
        if Value and not lastActionData then
            pcall(function()
                OSX:Notify({
                    Title = "Auto Attack",
                    Content = "กรุณาปามีดด้วยตนเอง 1 ครั้งก่อนเพื่อให้ระบบเริ่มทำงาน",
                    Type = "Warning"
                })
            end)
        end
    end
})

AimbotPanel:AddSlider({
    Title = "Auto Attack Delay",
    Description = "ความเร็วในการโจมตี/ปามีดอัตโนมัติ (วินาทีต่อครั้ง)",
    Min = 0.05,
    Max = 2.0,
    Rounding = 2,
    Default = 0.5,
    Callback = function(Value)
        AutoAttack_Settings.Delay = Value
    end
})

AimbotPanel:AddDropdown({
    Title = "Aim Target Part",
    Description = "ส่วนร่างกายที่ต้องการล็อค",
    Values = {"Head", "HumanoidRootPart"},
    Default = 1,
    Callback = function(Value)
        Aimbot_Settings.AimPart = Value
    end
})

AimbotPanel:AddDropdown({
    Title = "Aimbot Method",
    Description = "โหมดการทำงาน (Silent Aim Namecall ทำงานได้ดีสำหรับการปามีด)",
    Values = {"Camera Lock", "Silent Aim (Mouse.Hit)", "Silent Aim (Namecall)"},
    Default = 1,
    Callback = function(Value)
        Aimbot_Settings.Method = Value
    end
})

AimbotPanel:AddSlider({
    Title = "Aimbot FOV",
    Description = "ขนาดขอบเขตการล็อคเป้า (วงกลมหน้าจอ)",
    Min = 10,
    Max = 800,
    Default = 200,
    Callback = function(Value)
        Aimbot_Settings.FOV = Value
    end
})

-- Hitbox Expander Panel
local HitboxPanel = CombatTab:AddPanel("Hitbox Expander")

HitboxPanel:AddToggle({
    Title = "Hitbox Expander Enabled",
    Description = "ขยายกล่องชนของเป้าหมายเพื่อช่วยให้โจมตี/ปามีดโดนได้ง่ายขึ้นมาก",
    Default = false,
    Callback = function(Value)
        Hitbox_Settings.Enabled = Value
        if not Value then
            -- Reset all hitboxes
            for _, player in pairs(Players:GetPlayers()) do
                if player.Character then
                    ResetHitbox(player.Character)
                end
            end
        else
            UpdateHitbox()
        end
    end
})

HitboxPanel:AddDropdown({
    Title = "Hitbox Target Part",
    Description = "เลือกส่วนที่ต้องการขยาย",
    Values = {"HumanoidRootPart", "Head"},
    Default = 1,
    Callback = function(Value)
        -- Reset all hitboxes before changing target part
        for _, player in pairs(Players:GetPlayers()) do
            if player.Character then
                ResetHitbox(player.Character)
            end
        end
        Hitbox_Settings.Part = Value
        if Hitbox_Settings.Enabled then
            UpdateHitbox()
        end
    end
})

HitboxPanel:AddSlider({
    Title = "Hitbox Size",
    Description = "ขนาดของการขยาย (ค่าเริ่มต้นคือ 2, สูงสุดคือ 25)",
    Min = 2,
    Max = 25,
    Rounding = 1,
    Default = 10,
    Callback = function(Value)
        Hitbox_Settings.Size = Value
        if Hitbox_Settings.Enabled then
            UpdateHitbox()
        end
    end
})

HitboxPanel:AddSlider({
    Title = "Hitbox Transparency",
    Description = "ความโปร่งใสของพาร์ทที่ขยาย (0 = ทึบแสง, 1 = มองไม่เห็น)",
    Min = 0,
    Max = 1,
    Rounding = 2,
    Default = 0.7,
    Callback = function(Value)
        Hitbox_Settings.Transparency = Value
        if Hitbox_Settings.Enabled then
            UpdateHitbox()
        end
    end
})

AimbotPanel:AddToggle({
    Title = "Show FOV Circle",
    Description = "แสดงวงกลมขอบเขต Aimbot",
    Default = true,
    Callback = function(Value)
        Aimbot_Settings.ShowFOV = Value
    end
})

AimbotPanel:AddSlider({
    Title = "Camera Smoothness",
    Description = "ความสมูทในการหมุนกล้อง (ค่าเล็กลง = ช้าลง)",
    Min = 0.05,
    Max = 1,
    Rounding = 2,
    Default = 0.2,
    Callback = function(Value)
        Aimbot_Settings.Smoothness = Value
    end
})

AimbotPanel:AddDropdown({
    Title = "Activation Keybind",
    Description = "ปุ่มที่ใช้กดเพื่อล็อคเป้า (มือถือแนะนำเลือก Always Active)",
    Values = {"Always Active", "Right Click", "E Key", "Left Shift"},
    Default = 1,
    Callback = function(Value)
        Aimbot_Settings.Key = Value
    end
})

-- ==========================================
-- Visuals Tab
-- ==========================================
local VisualsTab = Window:AddTab({ Title = "Visuals", SubDescription = "ESP Settings", Icon = "eye" })
local EspPanel = VisualsTab:AddPanel("ESP Characters (No Highlight)")

EspPanel:AddToggle({
    Title = "ESP 3D Boxes",
    Description = "แสดงกล่อง 3D รอบตัวละคร (ไม่จำกัดจำนวน)",
    Default = false,
    Callback = function(Value)
        ESP_Settings.Boxes = Value
        if Value then
            MonitorCharactersFolder()
        else
            if not ESP_Settings.Names and not ESP_Settings.Tracers then
                StopESP()
            else
                UpdateESP()
            end
        end
    end
})

EspPanel:AddToggle({
    Title = "ESP Names",
    Description = "แสดงชื่อ ระยะทาง และเลือดของตัวละคร",
    Default = false,
    Callback = function(Value)
        ESP_Settings.Names = Value
        if Value then
            MonitorCharactersFolder()
        else
            if not ESP_Settings.Boxes and not ESP_Settings.Tracers then
                StopESP()
            else
                UpdateESP()
            end
        end
    end
})

EspPanel:AddToggle({
    Title = "ESP Tracers",
    Description = "แสดงเส้นนำสายตาไปยังตัวละคร",
    Default = false,
    Callback = function(Value)
        ESP_Settings.Tracers = Value
        if Value then
            MonitorCharactersFolder()
        else
            if not ESP_Settings.Boxes and not ESP_Settings.Names then
                StopESP()
            else
                UpdateESP()
            end
        end
    end
})

EspPanel:AddToggle({
    Title = "Team Check",
    Description = "ไม่แสดง ESP กับเพื่อนร่วมทีม (ยกเว้นโหมด FFA หรือ Neutral)",
    Default = false,
    Callback = function(Value)
        ESP_Settings.TeamCheck = Value
        UpdateESP()
    end
})

-- ==========================================
-- Settings Tab
-- ==========================================
local SettingsTab = Window:AddTab({ Title = "Settings", SubDescription = "UI & Keybinds", Icon = "settings" })
local SettingsPanel = SettingsTab:AddPanel("Config")
SettingsPanel:AddWideButton({
    Title = "Destroy UI",
    Callback = function()
        StopESP()
        if FOVCircle then
            pcall(function() FOVCircle:Destroy() end)
        end
        Window:Destroy()
    end
})
